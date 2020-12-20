const { rpn } = require('../commands/util/rpn');
const { ALL_FUNCTIONS } = require('../commands/string');

const CONTEXT = { limits: { stringLength: 1000 } };

const execRpn = rpn(ALL_FUNCTIONS);
const calc = (tokens, values) => execRpn(tokens, values, CONTEXT);

describe('calc', () => {
  it('computes results of reverse-polish-notation expressions', () => {
    expect(calc([1])).toEqual(1);
    expect(calc([2, 3, '+'])).toEqual(2 + 3);
    expect(calc([1, 2, 3, '+', 9, '*', '-'])).toEqual(1 - ((2 + 3) * 9));
  });

  it('accepts literal strings encoded as JSON', () => {
    expect(calc(['"foo \\" bar \\n baz\\\\"'])).toEqual('foo " bar \n baz\\');
  });

  it('rejects invalid strings', () => {
    expect(() => calc(['"unterminated'])).toThrow();
    expect(() => calc(['"invalid \\. escape"'])).toThrow();
  });

  it('accepts custom variables', () => {
    expect(calc(['foo'], { foo: 7 })).toEqual(7);
  });

  it('performs calculations with custom variables', () => {
    expect(calc(
      ['foo', 'foo', '*', 'bar', '+'],
      { foo: 7, bar: 1 }
    )).toEqual((7 * 7) + 1);
  });

  it('rejects unsupported numbers of function arguments', () => {
    expect(() => calc([1, 2, '-:2'])).not.toThrow();
    expect(() => calc([1, 2, 2, '-:3'])).toThrow();
    expect(() => calc(['log:0'])).toThrow();
    expect(() => calc([1, 'log:1'])).not.toThrow();
    expect(() => calc([1, 2, 'log:2'])).not.toThrow();
    expect(() => calc([1, 2, 3, 'log:3'])).toThrow();
  });

  it('rejects mismatched arguments', () => {
    expect(() => calc([1, '+'])).toThrow();
    expect(() => calc([1, 2, 3, '+'])).toThrow();
  });
});

describe('String', () => {
  it('converts numbers to strings', () => {
    expect(calc([5005.5, 'String'])).toEqual('5005.5');
    expect(calc([-5005.5, 'String'])).toEqual('-5005.5');
    expect(calc([0, 'String'])).toEqual('0');
  });

  it('leaves strings unchanged', () => {
    expect(calc(['"foo"', 'String'])).toEqual('foo');
    expect(calc(['"0.1"', 'String'])).toEqual('0.1');
  });

  it('accepts an optional number of decimal places', () => {
    expect(calc([5005.5, 0, 'String:2'])).toEqual('5006');
    expect(calc([5005.5, 1, 'String:2'])).toEqual('5005.5');
    expect(calc([5005.5, 3, 'String:2'])).toEqual('5005.500');
    expect(calc([-5005.5, 3, 'String:2'])).toEqual('-5005.500');
  });

  it('rounds when decimal places are negative', () => {
    expect(calc([5005.5, -1, 'String:2'])).toEqual('5010');
    expect(calc([5005.5, -2, 'String:2'])).toEqual('5000');
    expect(calc([-5005.5, -3, 'String:2'])).toEqual('-5000');
  });

  it('returns 0 if the value is positive and rounds to 0', () => {
    expect(calc([0, -3, 'String:2'])).toEqual('0');
    expect(calc([0.00001, -3, 'String:2'])).toEqual('0');
    expect(calc([0, 3, 'String:2'])).toEqual('0.000');
    expect(calc([0.00001, 3, 'String:2'])).toEqual('0.000');
  });

  it('returns -0 if the value is negative and rounds to 0', () => {
    expect(calc([-0.00001, -3, 'String:2'])).toEqual('-0');
    expect(calc([-5.5, -3, 'String:2'])).toEqual('-0');
    expect(calc([-0.00001, 3, 'String:2'])).toEqual('-0.000');
  });
});

describe('Number', () => {
  it('converts strings to numbers', () => {
    expect(calc(['"7.2"', 'Number'])).toEqual(7.2);
    expect(calc(['"-7.2e2"', 'Number'])).toEqual(-720);
    expect(calc(['"7.2e-2"', 'Number'])).toEqual(0.072);
  });

  it('leaves numbers unchanged', () => {
    expect(calc([Math.PI, 'Number'])).toEqual(Math.PI);
  });
});

describe('number functions', () => {
  it('+, -, *, /', () => {
    expect(calc([1, 2, '+'])).toEqual(3);
    expect(calc(['"0"', '"0"', '+'])).toEqual('00');
    expect(calc(['"0"', 1, '+'])).toEqual('01');
    expect(calc([1, '"0"', '+'])).toEqual('10');

    expect(calc([1, 2, '-'])).toEqual(-1);
    expect(calc(['"1"', '"2"', '-'])).toEqual(-1);

    expect(calc([2, 3, '*'])).toEqual(6);

    expect(calc([10, 4, '/'])).toEqual(2.5);
    expect(calc([10, 4, '//'])).toEqual(2);
  });

  it('variadic +, *', () => {
    expect(calc([1, 2, 3, '+:3'])).toEqual(6);
    expect(calc([1, 2, '"0"', '+:3'])).toEqual('120');

    expect(calc([2, 3, 4, '*:3'])).toEqual(24);
  });

  it('^', () => {
    expect(calc([2, 3, '^'])).toEqual(8);
    expect(calc(['"2"', 3, '^'])).toEqual('222');
    expect(calc(['"foo"', 3, '^'])).toEqual('foofoofoo');
  });

  it('%', () => {
    expect(calc([4, 3, '%'])).toEqual(1);
    expect(calc([3, 3, '%'])).toEqual(0);
    expect(calc([10, 3, '%'])).toEqual(1);
    expect(calc([-1, 3, '%'])).toEqual(-1);
  });

  it('mod', () => {
    expect(calc([4, 3, 'mod'])).toEqual(1);
    expect(calc([3, 3, 'mod'])).toEqual(0);
    expect(calc([10, 3, 'mod'])).toEqual(1);
    expect(calc([-1, 3, 'mod'])).toEqual(2);
  });

  it('neg', () => {
    expect(calc([2, 'neg'])).toEqual(-2);
  });

  it('max', () => {
    expect(calc([1, 2, 'max'])).toEqual(2);
    expect(calc([20, 1, 'max'])).toEqual(20);
    expect(calc([2, 10, 4, 'max:3'])).toEqual(10);
    expect(calc([11, 5, 2, 'max:3'])).toEqual(11);
    expect(calc([9, 2, 11, 'max:3'])).toEqual(11);
  });

  it('min', () => {
    expect(calc([1, 2, 'min'])).toEqual(1);
    expect(calc([20, 1, 'min'])).toEqual(1);
    expect(calc([2, 10, 4, 'min:3'])).toEqual(2);
    expect(calc([11, 5, 2, 'min:3'])).toEqual(2);
    expect(calc([9, 2, 11, 'min:3'])).toEqual(2);
  });

  it('bitor, bitand, bitxor, bitneg', () => {
    expect(calc([0b0011, 0b0101, 'bitor'])).toEqual(0b0111);
    expect(calc([0b0011, 0b0101, 'bitand'])).toEqual(0b0001);
    expect(calc([0b0011, 0b0101, 'bitxor'])).toEqual(0b0110);
    expect(calc([0, 'bitneg'])).toEqual(-1);
  });
});

describe('trig functions', () => {
  it('log', () => {
    expect(calc([1, 'log'])).toEqual(0);
    expect(calc([10, 'log'])).toEqual(Math.log(10));

    expect(calc([1, 10, 'log:2'])).toEqual(0);
    expect(calc([10, 10, 'log:2'])).toBeCloseTo(1);
    expect(calc([100, 10, 'log:2'])).toBeCloseTo(2);
    expect(calc([0.1, 10, 'log:2'])).toBeCloseTo(-1);

    expect(calc([8, 2, 'log:2'])).toBeCloseTo(3);
    expect(calc([0.25, 2, 'log:2'])).toBeCloseTo(-2);
  });

  it('exp', () => {
    expect(calc([0, 'exp'])).toEqual(1);
    expect(calc([10, 'exp'])).toEqual(Math.exp(10));

    expect(calc([0, 10, 'exp:2'])).toEqual(1);
    expect(calc([1, 10, 'exp:2'])).toBeCloseTo(10);
    expect(calc([2, 10, 'exp:2'])).toBeCloseTo(100);
    expect(calc([-1, 10, 'exp:2'])).toBeCloseTo(0.1);

    expect(calc([3, 2, 'exp:2'])).toBeCloseTo(8);
    expect(calc([-2, 2, 'exp:2'])).toBeCloseTo(0.25);
  });

  it('sin, cos, tan, asin, acos, atan', () => {
    expect(calc([Math.PI, 2, '/', 'sin'])).toBeCloseTo(1);
    expect(calc([Math.PI, 2, '/', 'cos'])).toBeCloseTo(0);
    expect(calc([Math.PI, 4, '/', 'tan'])).toBeCloseTo(1);
    expect(calc([1, 'asin'])).toBeCloseTo(Math.PI / 2);
    expect(calc([0, 'acos'])).toBeCloseTo(Math.PI / 2);
    expect(calc([1, 'atan'])).toBeCloseTo(Math.PI / 4);
  });

  it('round', () => {
    expect(calc([0.4, 'round'])).toEqual(0);
    expect(calc([0.5, 'round'])).toEqual(1);
    expect(calc([0.6, 'round'])).toEqual(1);
    expect(calc([1.0, 'round'])).toEqual(1);
    expect(calc([-0.5, 'round'])).toEqual(-0);
    expect(calc([1.5, 'round'])).toEqual(2);
  });

  it('floor', () => {
    expect(calc([0.4, 'floor'])).toEqual(0);
    expect(calc([0.5, 'floor'])).toEqual(0);
    expect(calc([0.6, 'floor'])).toEqual(0);
    expect(calc([1.0, 'floor'])).toEqual(1);
    expect(calc([-0.5, 'floor'])).toEqual(-1);
    expect(calc([1.5, 'floor'])).toEqual(1);
  });

  it('ceil', () => {
    expect(calc([0.4, 'ceil'])).toEqual(1);
    expect(calc([0.5, 'ceil'])).toEqual(1);
    expect(calc([0.6, 'ceil'])).toEqual(1);
    expect(calc([1.0, 'ceil'])).toEqual(1);
    expect(calc([-0.5, 'ceil'])).toEqual(-0);
    expect(calc([1.5, 'ceil'])).toEqual(2);
  });
});

describe('string functions', () => {
  it('length', () => {
    expect(calc(['"hi"', 'length'])).toEqual(2);
    expect(calc(['""', 'length'])).toEqual(0);
  });

  it('indexOf, lastIndexOf', () => {
    expect(calc(['"abc abc abc"', '"abc"', 'indexOf'])).toEqual(0);
    expect(calc(['"abc abc abc"', '"x"', 'indexOf'])).toEqual(-1);
    expect(calc(['"abc abc abc"', '"abc"', 5, 'indexOf:3'])).toEqual(8);

    expect(calc(['"abc abc abc"', '"abc"', 'lastIndexOf'])).toEqual(8);
    expect(calc(['"abc abc abc"', '"x"', 'lastIndexOf'])).toEqual(-1);
    expect(calc(['"abc abc abc"', '"abc"', 5, 'lastIndexOf:3'])).toEqual(4);
  });

  it('padStart, padEnd', () => {
    expect(calc(['"hi"', 7, 'padStart'])).toEqual('     hi');
    expect(calc(['"hi"', 7, '"ABC"', 'padStart:3'])).toEqual('ABCABhi');

    expect(calc(['"hi"', 7, 'padEnd'])).toEqual('hi     ');
    expect(calc(['"hi"', 7, '"ABC"', 'padEnd:3'])).toEqual('hiABCAB');
  });

  it('slice', () => {
    expect(calc(['"foo bar baz"', 4, 7, 'slice:3'])).toEqual('bar');
    expect(calc(['"foo bar baz"', 4, 'slice'])).toEqual('bar baz');
    expect(calc(['"foo bar baz"', -2, 'slice'])).toEqual('az');
    expect(calc(['"foo bar baz"', 1, -2, 'slice:3'])).toEqual('oo bar b');
    expect(calc(['"foo bar baz"', -3, -1, 'slice:3'])).toEqual('ba');
    expect(calc(['"foo bar baz"', -5, 9, 'slice:3'])).toEqual('r b');
  });

  it('slice (empty)', () => {
    expect(calc(['"foo bar baz"', 5, 5, 'slice:3'])).toEqual('');
    expect(calc(['"foo bar baz"', -3, -3, 'slice:3'])).toEqual('');
    expect(calc(['"foo bar baz"', 9, -2, 'slice:3'])).toEqual('');
    expect(calc(['"foo bar baz"', 9, -3, 'slice:3'])).toEqual('');
    expect(calc(['"foo bar baz"', -2, 9, 'slice:3'])).toEqual('');
    expect(calc(['"foo bar baz"', 11, 12, 'slice:3'])).toEqual('');
    expect(calc(['"foo bar baz"', 12, 13, 'slice:3'])).toEqual('');
  });

  it('substr', () => {
    expect(calc(['"foo bar baz"', 4, 3, 'substr'])).toEqual('bar');
    expect(calc(['"foo bar baz"', -3, 2, 'substr'])).toEqual('ba');
    expect(calc(['"foo bar baz"', 0, 100, 'substr'])).toEqual('foo bar baz');
    expect(calc(['"foo bar baz"', -3, 10, 'substr'])).toEqual('baz');
    expect(calc(['"foo bar baz"', -6, 14, 'substr'])).toEqual('ar baz');

    expect(calc(['"foo bar baz"', 1, 0, 'substr'])).toEqual('');
    expect(calc(['"foo bar baz"', 1, -1, 'substr'])).toEqual('');
    expect(calc(['"foo bar baz"', 11, 1, 'substr'])).toEqual('');
    expect(calc(['"foo bar baz"', 12, 1, 'substr'])).toEqual('');
  });
});
