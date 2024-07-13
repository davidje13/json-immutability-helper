import mathCommands from '../src/commands/math.mjs';
import { update } from '../src/index.mjs';

describe('add', () => {
  it('operates on numbers', () => {
    expect(() => update('', ['add', 1])).throws('/ add: expected target to be number');
  });

  it('takes an addend', () => {
    expect(() => update(0, ['add'])).throws('/ add: expected [command, number]');
  });

  it('applies summation', () => {
    const updated = update(8, ['add', 2]);

    expect(updated).equals(10);
  });

  it('has alias +', () => {
    const updated = update(8, ['+', 2]);

    expect(updated).equals(10);
  });
});

describe('subtract', () => {
  it('operates on numbers', () => {
    expect(() => update('', ['subtract', 1])).throws('/ subtract: expected target to be number');
  });

  it('takes a subtrahend', () => {
    expect(() => update(0, ['subtract'])).throws('/ subtract: expected [command, number]');
  });

  it('applies subtraction', () => {
    const updated = update(8, ['subtract', 2]);

    expect(updated).equals(6);
  });

  it('has alias -', () => {
    const updated = update(8, ['-', 2]);

    expect(updated).equals(6);
  });
});

describe('rpn', () => {
  const update2 = update.context.with(mathCommands).update;

  it('operates on primitives', () => {
    expect(() => update2([], ['rpn'])).throws('/ rpn: expected target to be primitive');
  });

  it('takes command tokens', () => {
    expect(() => update2(0, ['rpn', []])).throws('/ rpn: expected [command, operations...]');
  });

  it('rejects changes of type', () => {
    expect(() => update2(7, ['rpn', '"abc"'])).throws('cannot change type of property');
  });

  it('applies a calculation in reverse Polish notation', () => {
    const result = update2(0, ['rpn', 7, 2, '+']);
    expect(result).equals(9);
  });

  it('provides the original numeric value as x', () => {
    const result = update2(2, ['rpn', 10, 'x', '/']);
    expect(result).equals(5);
  });

  it('provides mathematical constants', () => {
    const result = update2(2, ['rpn', 'pi']);
    expect(result).equals(Math.PI);
  });

  it('handles multiple operations', () => {
    const result = update2(9, ['rpn', 'x', 'x', 1, '+', '/']);
    expect(result).equals(0.9);
  });
});
