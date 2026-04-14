export function invariant(condition, msgFn) {
  if (!condition) {
    const msg = typeof msgFn === 'function' ? msgFn() : msgFn || 'bad input';
    throw new Error(msg);
  }
}

export const safeGet = (o, key) =>
  Object.prototype.hasOwnProperty.call(o, key) ? o[key] : undefined;

export const addProperty = (o, key, value) =>
  Object.defineProperty(o, key, {
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  });

export const isOp = Array.isArray;
export const isArrayIndex = (key, limit) => {
  const v = Number(key);
  return v >= 0 && v < limit && v.toFixed(0) === key;
};
