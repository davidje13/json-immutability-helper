const { rpn } = require('../commands/util/rpn');
const mathCommands = require('../commands/math');
const stringCommands = require('../commands/string');

const calc = rpn(
  Object.assign({}, mathCommands.rpnOperators, stringCommands.rpnOperators),
  Object.assign({}, mathCommands.rpnConstants, stringCommands.rpnConstants),
  { limits: { stringLength: 1000 } },
);

describe('rpn', () => {
  it('computes results of reverse-polish-notation expressions', () => {
    expect(calc([1])).equals(1);
    expect(calc([2, 3, '+'])).equals(2 + 3);
    expect(calc([1, 2, 3, '+', 9, '*', '-'])).equals(1 - (2 + 3) * 9);
  });

  it('accepts literal strings encoded as JSON', () => {
    expect(calc(['"foo \\" bar \\n baz\\\\"'])).equals('foo " bar \n baz\\');
  });

  it('rejects invalid strings', () => {
    expect(() => calc(['"unterminated'])).throws();

    expect(() => calc(['"invalid \\. escape"'])).throws();
  });

  it('accepts custom variables', () => {
    expect(calc(['foo'], { foo: 7 })).equals(7);
  });

  it('performs calculations with custom variables', () => {
    expect(calc(['foo', 'foo', '*', 'bar', '+'], { foo: 7, bar: 1 })).equals(7 * 7 + 1);
  });

  it('rejects unsupported numbers of function arguments', () => {
    expect(() => calc([1, 2, '-:2'])).resolves();
    expect(() => calc([1, 2, 2, '-:3'])).throws('invalid arity for -:3');
    expect(() => calc(['log:0'])).throws('invalid arity for log:0');
    expect(() => calc([1, 'log:1'])).resolves();
    expect(() => calc([1, 2, 'log:2'])).resolves();
    expect(() => calc([1, 2, 3, 'log:3'])).throws('invalid arity for log:3');
  });

  it('rejects mismatched arguments', () => {
    expect(() => calc([1, '+'])).throws('argument mismatch for +');
    expect(() => calc([1, 2, 3, '+'])).throws('argument mismatch');
  });
});

describe('String', () => {
  it('converts numbers to strings', () => {
    expect(calc([5005.5, 'String'])).equals('5005.5');
    expect(calc([-5005.5, 'String'])).equals('-5005.5');
    expect(calc([0, 'String'])).equals('0');
  });

  it('leaves strings unchanged', () => {
    expect(calc(['"foo"', 'String'])).equals('foo');
    expect(calc(['"0.1"', 'String'])).equals('0.1');
  });

  it('accepts an optional number of decimal places', () => {
    expect(calc([5005.5, 0, 'String:2'])).equals('5006');
    expect(calc([5005.5, 1, 'String:2'])).equals('5005.5');
    expect(calc([5005.5, 3, 'String:2'])).equals('5005.500');
    expect(calc([-5005.5, 3, 'String:2'])).equals('-5005.500');
  });

  it('rounds when decimal places are negative', () => {
    expect(calc([5005.5, -1, 'String:2'])).equals('5010');
    expect(calc([5005.5, -2, 'String:2'])).equals('5000');
    expect(calc([-5005.5, -3, 'String:2'])).equals('-5000');
  });

  it('returns 0 if the value is positive and rounds to 0', () => {
    expect(calc([0, -3, 'String:2'])).equals('0');
    expect(calc([0.00001, -3, 'String:2'])).equals('0');
    expect(calc([0, 3, 'String:2'])).equals('0.000');
    expect(calc([0.00001, 3, 'String:2'])).equals('0.000');
  });

  it('returns -0 if the value is negative and rounds to 0', () => {
    expect(calc([-0.00001, -3, 'String:2'])).equals('-0');
    expect(calc([-5.5, -3, 'String:2'])).equals('-0');
    expect(calc([-0.00001, 3, 'String:2'])).equals('-0.000');
  });
});

describe('Number', () => {
  it('converts strings to numbers', () => {
    expect(calc(['"7.2"', 'Number'])).equals(7.2);
    expect(calc(['"-7.2e2"', 'Number'])).equals(-720);
    expect(calc(['"7.2e-2"', 'Number'])).equals(0.072);
  });

  it('leaves numbers unchanged', () => {
    expect(calc([Math.PI, 'Number'])).equals(Math.PI);
  });
});

describe('number functions', () => {
  it('+, -, *, /', () => {
    expect(calc([1, 2, '+'])).equals(3);
    expect(calc(['"0"', '"0"', '+'])).equals(0);
    expect(calc(['"0"', 1, '+'])).equals(1);
    expect(calc([1, '"0"', '+'])).equals(1);

    expect(calc([1, 2, '-'])).equals(-1);
    expect(calc(['"1"', '"2"', '-'])).equals(-1);

    expect(calc([2, 3, '*'])).equals(6);

    expect(calc([10, 4, '/'])).equals(2.5);
    expect(calc([10, 4, '//'])).equals(2);
  });

  it('variadic +, *', () => {
    expect(calc([1, 2, 3, '+:3'])).equals(6);

    expect(calc([2, 3, 4, '*:3'])).equals(24);
  });

  it('^', () => {
    expect(calc([2, 3, '^'])).equals(8);
    expect(calc(['"2"', 3, '^'])).equals(8);
  });

  it('%', () => {
    expect(calc([4, 3, '%'])).equals(1);
    expect(calc([3, 3, '%'])).equals(0);
    expect(calc([10, 3, '%'])).equals(1);
    expect(calc([-1, 3, '%'])).equals(-1);
  });

  it('mod', () => {
    expect(calc([4, 3, 'mod'])).equals(1);
    expect(calc([3, 3, 'mod'])).equals(0);
    expect(calc([10, 3, 'mod'])).equals(1);
    expect(calc([-1, 3, 'mod'])).equals(2);
  });

  it('neg', () => {
    expect(calc([2, 'neg'])).equals(-2);
  });

  it('max', () => {
    expect(calc([1, 2, 'max'])).equals(2);
    expect(calc([20, 1, 'max'])).equals(20);
    expect(calc([2, 10, 4, 'max:3'])).equals(10);
    expect(calc([11, 5, 2, 'max:3'])).equals(11);
    expect(calc([9, 2, 11, 'max:3'])).equals(11);
  });

  it('min', () => {
    expect(calc([1, 2, 'min'])).equals(1);
    expect(calc([20, 1, 'min'])).equals(1);
    expect(calc([2, 10, 4, 'min:3'])).equals(2);
    expect(calc([11, 5, 2, 'min:3'])).equals(2);
    expect(calc([9, 2, 11, 'min:3'])).equals(2);
  });

  it('bitor, bitand, bitxor, bitneg', () => {
    expect(calc([0b0011, 0b0101, 'bitor'])).equals(0b0111);
    expect(calc([0b0011, 0b0101, 'bitand'])).equals(0b0001);
    expect(calc([0b0011, 0b0101, 'bitxor'])).equals(0b0110);
    expect(calc([0, 'bitneg'])).equals(-1);
  });
});

describe('trig functions', () => {
  it('log', () => {
    expect(calc([1, 'log'])).equals(0);
    expect(calc([10, 'log'])).equals(Math.log(10));

    expect(calc([1, 10, 'log:2'])).equals(0);
    expect(calc([10, 10, 'log:2'])).isNear(1);
    expect(calc([100, 10, 'log:2'])).isNear(2);
    expect(calc([0.1, 10, 'log:2'])).isNear(-1);

    expect(calc([8, 2, 'log:2'])).isNear(3);
    expect(calc([0.25, 2, 'log:2'])).isNear(-2);
  });

  it('exp', () => {
    expect(calc([0, 'exp'])).equals(1);
    expect(calc([10, 'exp'])).equals(Math.exp(10));

    expect(calc([0, 10, 'exp:2'])).equals(1);
    expect(calc([1, 10, 'exp:2'])).isNear(10);
    expect(calc([2, 10, 'exp:2'])).isNear(100);
    expect(calc([-1, 10, 'exp:2'])).isNear(0.1);

    expect(calc([3, 2, 'exp:2'])).isNear(8);
    expect(calc([-2, 2, 'exp:2'])).isNear(0.25);
  });

  it('sin, cos, tan, asin, acos, atan', () => {
    expect(calc([Math.PI, 2, '/', 'sin'])).isNear(1);
    expect(calc([Math.PI, 2, '/', 'cos'])).isNear(0);
    expect(calc([Math.PI, 4, '/', 'tan'])).isNear(1);
    expect(calc([1, 'asin'])).isNear(Math.PI / 2);
    expect(calc([0, 'acos'])).isNear(Math.PI / 2);
    expect(calc([1, 'atan'])).isNear(Math.PI / 4);
  });

  it('round', () => {
    expect(calc([0.4, 'round'])).equals(0);
    expect(calc([0.5, 'round'])).equals(1);
    expect(calc([0.6, 'round'])).equals(1);
    expect(calc([1.0, 'round'])).equals(1);
    expect(calc([-0.5, 'round'])).equals(-0);
    expect(calc([1.5, 'round'])).equals(2);
  });

  it('floor', () => {
    expect(calc([0.4, 'floor'])).equals(0);
    expect(calc([0.5, 'floor'])).equals(0);
    expect(calc([0.6, 'floor'])).equals(0);
    expect(calc([1.0, 'floor'])).equals(1);
    expect(calc([-0.5, 'floor'])).equals(-1);
    expect(calc([1.5, 'floor'])).equals(1);
  });

  it('ceil', () => {
    expect(calc([0.4, 'ceil'])).equals(1);
    expect(calc([0.5, 'ceil'])).equals(1);
    expect(calc([0.6, 'ceil'])).equals(1);
    expect(calc([1.0, 'ceil'])).equals(1);
    expect(calc([-0.5, 'ceil'])).equals(-0);
    expect(calc([1.5, 'ceil'])).equals(2);
  });
});

describe('string functions', () => {
  it('length', () => {
    expect(calc(['"hi"', 'length'])).equals(2);
    expect(calc(['""', 'length'])).equals(0);
  });

  it('concat', () => {
    expect(calc([1, 2, 'concat'])).equals('12');
    expect(calc(['"0"', '"0"', 'concat'])).equals('00');
    expect(calc(['"0"', 1, 'concat'])).equals('01');
    expect(calc([1, '"0"', 'concat'])).equals('10');
    expect(calc([1, 2, '"0"', 'concat:3'])).equals('120');
  });

  it('repeat', () => {
    expect(calc(['"2"', 3, 'repeat'])).equals('222');
    expect(calc(['"foo"', 3, 'repeat'])).equals('foofoofoo');
  });

  it('indexOf, lastIndexOf', () => {
    expect(calc(['"abc abc abc"', '"abc"', 'indexOf'])).equals(0);
    expect(calc(['"abc abc abc"', '"x"', 'indexOf'])).equals(-1);
    expect(calc(['"abc abc abc"', '"abc"', 5, 'indexOf:3'])).equals(8);

    expect(calc(['"abc abc abc"', '"abc"', 'lastIndexOf'])).equals(8);
    expect(calc(['"abc abc abc"', '"x"', 'lastIndexOf'])).equals(-1);
    expect(calc(['"abc abc abc"', '"abc"', 5, 'lastIndexOf:3'])).equals(4);
  });

  it('padStart, padEnd', () => {
    expect(calc(['"hi"', 7, 'padStart'])).equals('     hi');
    expect(calc(['"hi"', 7, '"ABC"', 'padStart:3'])).equals('ABCABhi');

    expect(calc(['"hi"', 7, 'padEnd'])).equals('hi     ');
    expect(calc(['"hi"', 7, '"ABC"', 'padEnd:3'])).equals('hiABCAB');
  });

  it('slice', () => {
    expect(calc(['"foo bar baz"', 4, 7, 'slice:3'])).equals('bar');
    expect(calc(['"foo bar baz"', 4, 'slice'])).equals('bar baz');
    expect(calc(['"foo bar baz"', -2, 'slice'])).equals('az');
    expect(calc(['"foo bar baz"', 1, -2, 'slice:3'])).equals('oo bar b');
    expect(calc(['"foo bar baz"', -3, -1, 'slice:3'])).equals('ba');
    expect(calc(['"foo bar baz"', -5, 9, 'slice:3'])).equals('r b');
  });

  it('slice (empty)', () => {
    expect(calc(['"foo bar baz"', 5, 5, 'slice:3'])).equals('');
    expect(calc(['"foo bar baz"', -3, -3, 'slice:3'])).equals('');
    expect(calc(['"foo bar baz"', 9, -2, 'slice:3'])).equals('');
    expect(calc(['"foo bar baz"', 9, -3, 'slice:3'])).equals('');
    expect(calc(['"foo bar baz"', -2, 9, 'slice:3'])).equals('');
    expect(calc(['"foo bar baz"', 11, 12, 'slice:3'])).equals('');
    expect(calc(['"foo bar baz"', 12, 13, 'slice:3'])).equals('');
  });

  it('substr', () => {
    expect(calc(['"foo bar baz"', 4, 3, 'substr'])).equals('bar');
    expect(calc(['"foo bar baz"', -3, 2, 'substr'])).equals('ba');
    expect(calc(['"foo bar baz"', 0, 100, 'substr'])).equals('foo bar baz');
    expect(calc(['"foo bar baz"', -3, 10, 'substr'])).equals('baz');
    expect(calc(['"foo bar baz"', -6, 14, 'substr'])).equals('ar baz');

    expect(calc(['"foo bar baz"', 1, 0, 'substr'])).equals('');
    expect(calc(['"foo bar baz"', 1, -1, 'substr'])).equals('');
    expect(calc(['"foo bar baz"', 11, 1, 'substr'])).equals('');
    expect(calc(['"foo bar baz"', 12, 1, 'substr'])).equals('');
  });
});
