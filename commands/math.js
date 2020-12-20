const { rpnCommand } = require('./util/rpn');

const inf = Number.POSITIVE_INFINITY;

/* eslint-disable quote-props, no-bitwise */
const MATH_FUNCTIONS = {
  Number: [1, 1, (v) => Number.parseFloat(v)],
  '+': [2, inf, (...v) => v.reduce((a, b) => (a + Number(b)), 0)],
  '-': [2, 2, (a, b) => (a - b)],
  '*': [2, inf, (...v) => v.reduce((a, b) => (a * Number(b)), 1)],
  '/': [2, 2, (a, b) => (a / b)],
  '//': [2, 2, (a, b) => Math.trunc(a / b)],
  '^': [2, 2, (a, b) => Math.pow(a, b)],
  '%': [2, 2, (a, b) => (a % b)],
  mod: [2, 2, (a, b) => (((a % b) + b) % b)],
  neg: [1, 1, (a) => -a],
  log: [1, 2, (v, b) => (b ? (Math.log(v) / Math.log(b)) : Math.log(v))],
  exp: [1, 2, (v, b) => (b ? (Math.pow(b, v)) : Math.exp(v))],
  max: [2, inf, Math.max],
  min: [2, inf, Math.min],
  bitor: [2, 2, (a, b) => (a | b)],
  bitand: [2, 2, (a, b) => (a & b)],
  bitxor: [2, 2, (a, b) => (a ^ b)],
  bitneg: [1, 1, (a) => (~a)],
};
/* eslint-enable quote-props, no-bitwise */

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

const commands = {
  rpn: rpnCommand,
};

module.exports = {
  mathCommands: {
    commands,
    rpnFunctions: MATH_FUNCTIONS,
    rpnConstants: {
      e: Math.E,
      pi: Math.PI,
      Inf: inf,
      NaN: Number.NaN,
    },
  },
};
