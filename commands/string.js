const config = require('./util/commandTypeCheck');
const { makeRpnCommand } = require('./util/rpn');
const { MATH_FUNCTIONS } = require('./math');

function isInt(x) {
  return Math.round(x) === x;
}

/* eslint-disable quote-props */
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
  '+': [2, Number.POSITIVE_INFINITY, function(...v) {
    if (v.some((arg) => typeof arg !== 'number')) {
      return v.reduce((a, b) => {
        if (a.length + b.length > this.limits.stringLength) {
          throw new Error('string concatenation too long');
        }
        return a + b;
      }, '');
    }
    return v.reduce((a, b) => (a + b), 0);
  }],
  '^': [2, 2, function(a, b) {
    if (typeof a === 'string') {
      if (!isInt(b) || b < 0 || b * a.length > this.limits.stringLength) {
        throw new Error(`unsupported repeat count ${b}`);
      }
      return a.repeat(b);
    }
    return Math.pow(a, b);
  }],
  length: [1, 1, (str) => str.length],
  indexOf: [2, 3, (str, token, start) => str.indexOf(token, start)],
  lastIndexOf: [2, 3, (str, token, end) => str.lastIndexOf(token, end)],
  padStart: [2, 3, function(str, length, padding) {
    if (!isInt(length) || length < 0 || length > this.limits.stringLength) {
      throw new Error(`unsupported padding length ${length}`);
    }
    return str.padStart(length, padding);
  }],
  padEnd: [2, 3, function(str, length, padding) {
    if (!isInt(length) || length < 0 || length > this.limits.stringLength) {
      throw new Error(`unsupported padding length ${length}`);
    }
    return str.padEnd(length, padding);
  }],
  slice: [2, 3, (str, from, to) => str.slice(from, to)],
  substr: [3, 3, (str, from, length) => str.substr(from, length)],
};
/* eslint-enable quote-props */

const ALL_FUNCTIONS = Object.assign({}, MATH_FUNCTIONS, STRING_FUNCTIONS);

const commands = {
  replaceAll: config('string', 'find:string', 'replace:string')((
    object,
    [find, replace],
    context
  ) => {
    if (!find || find === replace) {
      return object;
    }
    const parts = String.prototype.split.call(object, find);
    if (replace.length > find.length) {
      const count = parts.length - 1;
      const diff = count * (replace.length - find.length);
      context.invariant(
        object.length + diff <= context.limits.stringLength,
        'too much data'
      );
      context.incLoopNesting(count, () => null);
    }
    return parts.join(replace);
  }),

  rpn: makeRpnCommand('primitive', ALL_FUNCTIONS),
};

module.exports = {
  ALL_FUNCTIONS,
  stringCommands: { commands },
};
