import { isOp, safeGet } from '../../util.mjs';

export function optimiseListSequence(seq, context, optFromIndex) {
  if (!seq.some((op) => isOp(op) && ['update', 'delete'].includes(op[0]))) {
    return seq;
  }

  const result = [];
  let historyStop = 0;
  const handlers = new Map([
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
          histLoop: for (let p = result.length; p-- > historyStop; ) {
            const prev = result[p];
            if (!prev) {
              continue;
            }
            if (prev._invalidateOrder && typeof locator._ordinal === 'number') {
              break;
            }
            const prevOp = prev._op;
            const prevLoc0 = prev._locators[0];
            if (prevOp[0] === 'update') {
              if (isSameLocator(locator, prevLoc0) && (prevOp[3] || !op[3])) {
                const combined = [...prevOp];
                combined[2] = context.combine([prevOp[2], op[2]]);
                prev._op = combined;
                return true;
              }
              if (locatorsMayOverlap(prevLoc0, locator)) {
                break;
              }
            } else if (prevOp[0] === 'delete' && deleteMayInterfere(prevLoc0, locator)) {
              break;
            }
            for (const l of prev._locators) {
              if (keysOut.has(l._key)) {
                break histLoop;
              }
            }
          }
        }
        result.push({ _op: op, _locators: [locator] });
        return true;
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
          histLoop: for (let p = result.length; p-- > historyStop; ) {
            const prev = result[p];
            if (!prev) {
              continue;
            }
            if (prev._invalidateOrder && typeof locator._ordinal === 'number') {
              break;
            }
            const prevOp = prev._op;
            const prevLoc0 = prev._locators[0];
            if (
              isSameCondition(locator, prevLoc0) &&
              ((prevOp[0] === 'update' &&
                (locator._ordinal === prevLoc0._ordinal ||
                  typeof locator._ordinal !== 'number' ||
                  ([0, -1].includes(locator._ordinal) && prevLoc0._ordinal === 'one'))) ||
                (prevOp[0] === 'delete' &&
                  (locator._ordinal === 'all' || prevLoc0._ordinal === 'one')))
            ) {
              earliest = p;
              result[p] = null;
              continue;
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
    [
      'swap',
      (op) => {
        const locator1 = getSimpleLocator(op[1]);
        const locator2 = getSimpleLocator(op[2]);
        if (!locator1 || !locator2) {
          return false;
        }
        result.push({ _op: op, _invalidateOrder: true, _locators: [locator1, locator2] });
        return true;
      },
    ],
    [
      'move',
      (op) => {
        const locator1 = getSimpleLocator(op[1]);
        const locator2 = getSimpleLocator(op[3]);
        if (!locator1 || !locator2) {
          return false;
        }
        result.push({ _op: op, _invalidateOrder: true, _locators: [locator1, locator2] });
        return true;
      },
    ],
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
