const { mathCommands } = require('../commands/math');
const { update } = require('../index');

describe('add', () => {
  it('operates on numbers', () => {
    expect(() => update('', ['add', 1]))
      .toThrow('/ add: expected target to be number');
  });

  it('takes an addend', () => {
    expect(() => update(0, ['add']))
      .toThrow('/ add: expected [command, number]');
  });

  it('applies summation', () => {
    const updated = update(8, ['add', 2]);

    expect(updated).toEqual(10);
  });

  it('has alias +', () => {
    const updated = update(8, ['+', 2]);

    expect(updated).toEqual(10);
  });
});

describe('subtract', () => {
  it('operates on numbers', () => {
    expect(() => update('', ['subtract', 1]))
      .toThrow('/ subtract: expected target to be number');
  });

  it('takes a subtrahend', () => {
    expect(() => update(0, ['subtract']))
      .toThrow('/ subtract: expected [command, number]');
  });

  it('applies subtraction', () => {
    const updated = update(8, ['subtract', 2]);

    expect(updated).toEqual(6);
  });

  it('has alias -', () => {
    const updated = update(8, ['-', 2]);

    expect(updated).toEqual(6);
  });
});

describe('rpn', () => {
  const update2 = update.context.with(mathCommands).update;

  it('operates on primitives', () => {
    expect(() => update2([], ['rpn']))
      .toThrow('/ rpn: expected target to be primitive');
  });

  it('takes command tokens', () => {
    expect(() => update2(0, ['rpn', []]))
      .toThrow('/ rpn: expected [command, operations...]');
  });

  it('rejects changes of type', () => {
    expect(() => update2(7, ['rpn', '"abc"']))
      .toThrow('cannot change type of property');
  });

  it('applies a calculation in reverse Polish notation', () => {
    const result = update2(0, ['rpn', 7, 2, '+']);
    expect(result).toEqual(9);
  });

  it('provides the original numeric value as x', () => {
    const result = update2(2, ['rpn', 10, 'x', '/']);
    expect(result).toEqual(5);
  });

  it('provides mathematical constants', () => {
    const result = update2(2, ['rpn', 'pi']);
    expect(result).toEqual(Math.PI);
  });

  it('handles multiple operations', () => {
    const result = update2(9, ['rpn', 'x', 'x', 1, '+', '/']);
    expect(result).toEqual(0.9);
  });
});
