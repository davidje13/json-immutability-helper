import { isOp, safeGet } from '../../util.mjs';

export function optimiseListSequence(seq, context, optFromIndex) {
  if (!seq.some((op) => isOp(op) && ['update'].includes(op[0]))) {
    return seq;
  }

  const result = [];
  const history = [];
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
          histLoop: for (let p = history.length; p-- > 0; ) {
            const h = history[p];
            if (h._invalidateOrder && typeof locator._ordinal === 'number') {
              break;
            }
            if (h._locator) {
              const prevOp = result[h._index];
              if (
                prevOp[0] === 'update' &&
                isSameLocator(h._locator, locator) &&
                (prevOp[3] || !op[3])
              ) {
                const combined = [...prevOp];
                combined[2] = context.combine([prevOp[2], op[2]]);
                result[h._index] = combined;
                return true;
              }
              if (locatorsMayOverlap(h._locator, locator)) {
                break;
              }
            }
            for (const key of h._keysIn ?? []) {
              if (keysOut.has(key)) {
                break histLoop;
              }
            }
          }
        }
        history.push({
          _index: result.length,
          _locator: locator,
          _keysIn: locator._key,
        });
        result.push(op);
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
        history.push({ _invalidateOrder: true, _keysIn: [locator1._key, locator2._key] });
        result.push(op);
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
        history.push({ _invalidateOrder: true, _keysIn: [locator1._key, locator2._key] });
        result.push(op);
        return true;
      },
    ],
  ]);
  for (const op of seq) {
    if (isOp(op) && handlers.get(op[0])?.(op)) {
      continue;
    }
    result.push(op);
    history.length = 0;
  }
  return result.filter((v) => v);
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

const isSameLocator = (a, b) =>
  a._key === b._key && a._value === b._value && a._ordinal === b._ordinal;

const locatorsMayOverlap = (a, b) =>
  a._key !== b._key ||
  (a._value === b._value &&
    (a._ordinal === b._ordinal ||
      typeof a._ordinal !== 'number' ||
      typeof b._ordinal !== 'number' ||
      a._ordinal >= 0 !== b._ordinal >= 0));
