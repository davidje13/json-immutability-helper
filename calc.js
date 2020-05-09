const { MAX_TOTAL_STRING_SIZE } = require('./limits');

const CONSTANTS = {
  e: Math.E,
  pi: Math.PI,
  Inf: Number.POSITIVE_INFINITY,
  NaN: Number.NaN,
};

function isInt(x) {
  return Math.round(x) === x;
}

/* eslint-disable quote-props, no-bitwise */
const MATH_FUNCTIONS = {
  Number: [1, 1, (v) => Number.parseFloat(v)],
  '+': [2, Number.POSITIVE_INFINITY, (...v) => {
    if (v.some((arg) => typeof arg !== 'number')) {
      throw new Error('cannot concatenate strings');
    }
    return v.reduce((a, b) => (a + b), 0);
  }],
  '-': [2, 2, (a, b) => (a - b)],
  '*': [2, Number.POSITIVE_INFINITY, (...v) => v.reduce((a, b) => (a * b), 1)],
  '/': [2, 2, (a, b) => (a / b)],
  '//': [2, 2, (a, b) => Math.trunc(a / b)],
  '^': [2, 2, (a, b) => {
    if (typeof a === 'string') {
      throw new Error('cannot repeat strings');
    }
    return Math.pow(a, b);
  }],
  '%': [2, 2, (a, b) => (a % b)],
  mod: [2, 2, (a, b) => (((a % b) + b) % b)],
  neg: [1, 1, (a) => -a],
  log: [1, 2, (v, b) => (b ? (Math.log(v) / Math.log(b)) : Math.log(v))],
  exp: [1, 2, (v, b) => (b ? (Math.pow(b, v)) : Math.exp(v))],
  max: [2, Number.POSITIVE_INFINITY, Math.max],
  min: [2, Number.POSITIVE_INFINITY, Math.min],
  bitor: [2, 2, (a, b) => (a | b)],
  bitand: [2, 2, (a, b) => (a & b)],
  bitxor: [2, 2, (a, b) => (a ^ b)],
  bitneg: [1, 1, (a) => (~a)],
};

[
  'abs',
  'log2', 'log10',
  'sin', 'cos', 'tan',
  'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'asinh', 'acosh', 'atanh',
  'round', 'floor', 'ceil', 'trunc',
].forEach((name) => {
  MATH_FUNCTIONS[name] = [1, 1, Math[name]];
});

const STRING_FUNCTIONS = {
  String: [1, 2, (v, dp = null) => {
    if (dp === null) {
      return String(v);
    }
    if (!isInt(dp) || dp < -20 || dp > 20) {
      throw new Error('unsupported decimal places');
    }
    if (dp < 0) {
      const str = (v / Math.pow(10, -dp)).toFixed();
      return (str === '0' || str === '-0') ? str : (str + '0'.repeat(-dp));
    }
    return v.toFixed(dp);
  }],
  '+': [2, Number.POSITIVE_INFINITY, (...v) => {
    if (v.some((arg) => typeof arg !== 'number')) {
      return v.reduce((a, b) => {
        if (a.length + b.length > MAX_TOTAL_STRING_SIZE) {
          throw new Error('string concatenation too long');
        }
        return a + b;
      }, '');
    }
    return v.reduce((a, b) => (a + b), 0);
  }],
  '^': [2, 2, (a, b) => {
    if (typeof a === 'string') {
      if (!isInt(b) || b < 0 || b * a.length > MAX_TOTAL_STRING_SIZE) {
        throw new Error(`unsupported repeat count ${b}`);
      }
      return a.repeat(b);
    }
    return Math.pow(a, b);
  }],
  length: [1, 1, (str) => str.length],
  indexOf: [2, 3, (str, token, start) => str.indexOf(token, start)],
  lastIndexOf: [2, 3, (str, token, end) => str.lastIndexOf(token, end)],
  padStart: [2, 3, (str, length, padding) => {
    if (!isInt(length) || length < 0 || length > MAX_TOTAL_STRING_SIZE) {
      throw new Error(`unsupported padding length ${length}`);
    }
    return str.padStart(length, padding);
  }],
  padEnd: [2, 3, (str, length, padding) => {
    if (!isInt(length) || length < 0 || length > MAX_TOTAL_STRING_SIZE) {
      throw new Error(`unsupported padding length ${length}`);
    }
    return str.padEnd(length, padding);
  }],
  slice: [2, 3, (str, from, to) => str.slice(from, to)],
  substr: [3, 3, (str, from, length) => str.substr(from, length)],
};
/* eslint-enable quote-props, no-bitwise */

const ALL_FUNCTIONS = Object.assign({}, MATH_FUNCTIONS, STRING_FUNCTIONS);

function applyFunction(functions, token, stack) {
  const [funcName, arityStr] = token.split(':');
  if (!functions[funcName]) {
    throw new Error(`unknown function ${funcName}`);
  }
  const [minArity, maxArity, fn] = functions[funcName];
  const arity = arityStr ? Number.parseInt(arityStr, 10) : minArity;
  if (arity < minArity || arity > maxArity) {
    throw new Error(`invalid arity for ${token}`);
  }
  if (stack.length < arity) {
    throw new Error(`argument mismatch for ${token}`);
  }
  stack.push(fn(...stack.splice(-arity)));
}

function applyReversePolish(tokens, values = {}, functions = ALL_FUNCTIONS) {
  const stack = [];
  tokens.forEach((token) => {
    if (typeof token === 'number') {
      stack.push(token);
    } else if (typeof token !== 'string') {
      throw new Error('unexpected token type');
    } else if (token.charAt(0) === '"') {
      stack.push(JSON.parse(token));
    } else if (Object.prototype.hasOwnProperty.call(CONSTANTS, token)) {
      stack.push(CONSTANTS[token]);
    } else if (Object.prototype.hasOwnProperty.call(values, token)) {
      stack.push(values[token]);
    } else {
      applyFunction(functions, token, stack);
    }
  });
  if (stack.length !== 1) {
    throw new Error('argument mismatch');
  }
  return stack[0];
}

module.exports = {
  MATH_FUNCTIONS,
  ALL_FUNCTIONS,
  applyReversePolish,
};
