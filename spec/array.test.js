const listCommands = require('../commands/list');
const { update } = require('../index').with(listCommands);

const initial = ['a', 'b', 'c'];

describe('push', () => {
  it('operates on arrays', () => {
    expect(() => update({}, ['push']))
      .toThrow('/ push: expected target to be array');
  });

  it('appends values', () => {
    const updated = update(initial, ['push', 'A', 'B', 'C']);

    expect(updated).toEqual(['a', 'b', 'c', 'A', 'B', 'C']);
    expect(updated).not.toBe(initial);
  });

  it('does nothing if there are no values to add', () => {
    const updated = update(initial, ['push']);

    expect(updated).toBe(initial);
  });
});

describe('unshift', () => {
  it('operates on arrays', () => {
    expect(() => update({}, ['unshift']))
      .toThrow('/ unshift: expected target to be array');
  });

  it('prepends values', () => {
    const updated = update(initial, ['unshift', 'A', 'B', 'C']);

    expect(updated).toEqual(['A', 'B', 'C', 'a', 'b', 'c']);
    expect(updated).not.toBe(initial);
  });

  it('does nothing if there are no values to add', () => {
    const updated = update(initial, ['unshift']);

    expect(updated).toBe(initial);
  });
});

describe('splice', () => {
  it('operates on arrays', () => {
    expect(() => update({}, ['splice']))
      .toThrow('/ splice: expected target to be array');
  });

  it('invokes splice', () => {
    const updated = update(initial, ['splice', [1, 1, 'A', 'B', 'C']]);

    expect(updated).toEqual(['a', 'A', 'B', 'C', 'c']);
    expect(updated).not.toBe(initial);
  });

  it('applies multiple splices in sequence', () => {
    const updated = update(initial, ['splice', [1, 1, 'A', 'B', 'C'], [2, 1]]);

    expect(updated).toEqual(['a', 'A', 'C', 'c']);
  });

  it('does nothing if the splice call has no effect', () => {
    const updated = update(initial, ['splice', [1, 0]]);

    expect(updated).toBe(initial);
  });
});
