const config = require('./util/commandTypeCheck');
const { rpnCommand } = require('./util/rpn');

function isInt(x) {
  return Math.round(x) === x;
}

/* eslint-disable quote-props */
const rpnOperators = {
  String: [1, 2, (v, dp = null) => {
    if (dp === null) {
      return String(v);
    }
    if (!isInt(dp) || dp < -20 || dp > 20) {
      throw new Error('unsupported decimal places');
    }
    if (dp < 0) {
      const str = (Number(v) / Math.pow(10, -dp)).toFixed();
      return (str === '0' || str === '-0') ? str : (str + '0'.repeat(-dp));
    }
    return Number(v).toFixed(dp);
  }],
  'concat': [2, Number.POSITIVE_INFINITY, function(...v) {
    const parts = v.map(String);
    if (parts.reduce((l, p) => (l + p.length), 0) > this.limits.stringLength) {
      throw new Error('string concatenation too long');
    }
    return parts.join('');
  }],
  'repeat': [2, 2, function(a, b) {
    const aStr = String(a);
    if (!isInt(b) || b < 0 || b * aStr.length > this.limits.stringLength) {
      throw new Error(`unsupported repeat count ${b}`);
    }
    return aStr.repeat(b);
  }],
  length: [1, 1, (str) => String(str).length],
  indexOf: [2, 3, (str, find, start) => String(str).indexOf(find, start)],
  lastIndexOf: [2, 3, (str, find, end) => String(str).lastIndexOf(find, end)],
  padStart: [2, 3, function(str, length, padding) {
    if (!isInt(length) || length < 0 || length > this.limits.stringLength) {
      throw new Error(`unsupported padding length ${length}`);
    }
    return String(str).padStart(length, padding);
  }],
  padEnd: [2, 3, function(str, length, padding) {
    if (!isInt(length) || length < 0 || length > this.limits.stringLength) {
      throw new Error(`unsupported padding length ${length}`);
    }
    return String(str).padEnd(length, padding);
  }],
  slice: [2, 3, (str, from, to) => String(str).slice(from, to)],
  substr: [3, 3, (str, from, length) => String(str).substr(from, length)],
};
/* eslint-enable quote-props */

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

  rpn: rpnCommand,
};

module.exports = {
  stringCommands: {
    commands,
    rpnOperators,
  },
};
