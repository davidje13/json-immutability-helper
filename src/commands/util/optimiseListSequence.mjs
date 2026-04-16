import { isOp, safeGet } from '../../util.mjs';

export function optimiseListSequence(seq, context, optFromIndex) {
  if (!seq.some((op) => isOp(op) && ['update', 'delete'].includes(op[0]))) {
    return seq;
  }

  const result = [];
  let historyStop = 0;

  const pushUnshift = (op) =>
    result.push({ _op: op, _locators: [], _addsItems: 1, _addsItemsIndex: 1 });
  const swapMove = (arg1, arg2) => (op) => {
    const locator1 = getSimpleLocator(op[arg1]);
    const locator2 = getSimpleLocator(op[arg2]);
    if (!locator1 || !locator2) {
      return false;
    }
    return result.push({ _op: op, _invalidateOrder: true, _locators: [locator1, locator2] });
  };

  const handlers = new Map([
    ['push', pushUnshift],
    ['unshift', pushUnshift],
    [
      'insert',
      (op) => {
        const locator = getSimpleLocator(op[2]);
        if (!locator) {
          return false;
        }
        return result.push({ _op: op, _locators: [locator], _addsItems: 2, _addsItemsIndex: 3 });
      },
    ],
    [
      'update',
      (op) => {
        const locator = getSimpleLocator(op[1]);
        if (!locator || mayChangeLocatorValueAway(op[2], locator)) {
          return false;
        }
        const keysOut = new Set(Object.keys(op[2]));
        keysOut.delete(locator._key);
        if (result.length >= optFromIndex) {
          const condition = context.makeConditionPredicate(op[1][1]);
          histLoop: for (let p = result.length; p-- > historyStop; ) {
            const prev = result[p];
            if (!prev) {
              continue;
            }
            if (prev._invalidateOrder && typeof locator._ordinal === 'number') {
              break;
            }
            if (prev._addsItems) {
              for (let i = prev._addsItemsIndex; i < prev._op.length; ++i) {
                if (condition(prev._op[i])) {
                  break histLoop;
                }
              }
            }
            switch (prev._op[0]) {
              case 'update':
                if (isSameLocator(locator, prev._locators[0]) && (prev._op[3] || !op[3])) {
                  const combined = [...prev._op];
                  combined[2] = context.combine([prev._op[2], op[2]]);
                  prev._op = combined;
                  return true;
                }
                if (locatorsMayOverlap(prev._locators[0], locator)) {
                  break histLoop;
                }
                break;
              case 'delete':
                if (deleteMayInterfere(prev._locators[0], locator)) {
                  break histLoop;
                }
                break;
            }
            for (const l of prev._locators) {
              if (keysOut.has(l._key)) {
                break histLoop;
              }
            }
          }
        }
        return result.push({ _op: op, _locators: [locator] });
      },
    ],
    [
      'delete',
      (op) => {
        const locator = getSimpleLocator(op[1]);
        if (!locator) {
          return false;
        }
        let earliest = result.length;
        if (result.length >= optFromIndex) {
          const condition = context.makeConditionPredicate(op[1][1]);
          histLoop: for (let p = result.length; p-- > historyStop; ) {
            const prev = result[p];
            if (!prev) {
              continue;
            }
            if (prev._invalidateOrder && typeof locator._ordinal === 'number') {
              break;
            }
            if (prev._addsItems) {
              const matchIdx = new Set();
              for (let i = prev._addsItemsIndex; i < prev._op.length; ++i) {
                if (condition(prev._op[i])) {
                  matchIdx.add(i);
                }
              }
              if (matchIdx.size) {
                if (
                  typeof locator._ordinal === 'number' ||
                  (locator._ordinal === 'one' && (matchIdx.size > 1 || prev._addsItems === 2))
                ) {
                  break;
                }
                prev._op = prev._op.filter((_, i) => !matchIdx.has(i));
                const removedAll = prev._op.length === prev._addsItemsIndex;
                if (removedAll) {
                  result[p] = null;
                }
                if (locator._ordinal === 'one') {
                  return true;
                }
                if (removedAll) {
                  continue;
                }
              }
            }
            const prevLoc0 = prev._locators[0];
            if (['update', 'delete'].includes(prev._op[0]) && isSameCondition(locator, prevLoc0)) {
              if (
                prev._op[0] === 'update'
                  ? locator._ordinal === prevLoc0._ordinal ||
                    typeof locator._ordinal !== 'number' ||
                    ([0, -1].includes(locator._ordinal) && prevLoc0._ordinal === 'one')
                  : locator._ordinal === 'all' || prevLoc0._ordinal === 'one'
              ) {
                earliest = p;
                result[p] = null;
                continue;
              }
            }
            for (const l of prev._locators) {
              if (deleteMayInterfere(locator, l)) {
                break histLoop;
              }
            }
          }
        }
        result[earliest] = { _op: op, _locators: [locator] };
        return true;
      },
    ],
    ['swap', swapMove(1, 2)],
    ['move', swapMove(1, 3)],
  ]);
  for (const op of seq) {
    if (isOp(op) && handlers.get(op[0])?.(op)) {
      continue;
    }
    result.push({ _op: op });
    historyStop = result.length;
  }

  const specOut = [];
  for (const r of result) {
    if (r) {
      specOut.push(r._op);
    }
  }
  return specOut;
}

function getSimpleLocator(locator) {
  if (!Array.isArray(locator) || locator.length !== 2) {
    return null;
  }
  let [ord, cond] = locator;
  if (!cond || typeof cond !== 'object' || Array.isArray(cond)) {
    return null;
  }
  if (ord === 'first') {
    ord = 0;
  }
  if (ord === 'last') {
    ord = -1;
  }
  if (typeof ord !== 'number' && !['all', 'one'].includes(ord)) {
    return null;
  }
  const items = Object.entries(cond);
  if (items.length !== 1) {
    return null;
  }
  const [key, check] = items[0];
  if (!Array.isArray(check) || check[0] !== '=' || check.length !== 2) {
    return null;
  }
  return { _ordinal: ord, _key: key, _value: check[1] };
}

function mayChangeLocatorValueAway(spec, locator) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    return true;
  }
  const op = safeGet(spec, locator._key);
  if (!op) {
    return false;
  }
  if (isOp(op) && op[0] === '=' && op[1] === locator._value) {
    return false;
  }
  return true;
}

const isSameCondition = (a, b) => a._key === b._key && a._value === b._value;
const isSameLocator = (a, b) => isSameCondition(a, b) && a._ordinal === b._ordinal;

const locatorsMayOverlap = (a, b) =>
  a._key !== b._key ||
  (a._value === b._value &&
    (a._ordinal === b._ordinal ||
      typeof a._ordinal !== 'number' ||
      typeof b._ordinal !== 'number' ||
      a._ordinal >= 0 !== b._ordinal >= 0));

const deleteMayInterfere = (del, next) => del._key !== next._key || del._value === next._value;
