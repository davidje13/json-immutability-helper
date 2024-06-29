const listCommands = require('../commands/list');
const { update } = require('../index').with(listCommands);

const initial = ['a', 'b', 'c'];

describe('push', () => {
  it('operates on arrays', () => {
    expect(() => update({}, ['push'])).throws('/ push: expected target to be array');
  });

  it('appends values', () => {
    const updated = update(initial, ['push', 'A', 'B', 'C']);

    expect(updated).equals(['a', 'b', 'c', 'A', 'B', 'C']);
    expect(updated).not(same(initial));
  });

  it('does nothing if there are no values to add', () => {
    const updated = update(initial, ['push']);

    expect(updated).same(initial);
  });
});

describe('unshift', () => {
  it('operates on arrays', () => {
    expect(() => update({}, ['unshift'])).throws('/ unshift: expected target to be array');
  });

  it('prepends values', () => {
    const updated = update(initial, ['unshift', 'A', 'B', 'C']);

    expect(updated).equals(['A', 'B', 'C', 'a', 'b', 'c']);
    expect(updated).not(same(initial));
  });

  it('does nothing if there are no values to add', () => {
    const updated = update(initial, ['unshift']);

    expect(updated).same(initial);
  });
});

describe('splice', () => {
  it('operates on arrays', () => {
    expect(() => update({}, ['splice'])).throws('/ splice: expected target to be array');
  });

  it('invokes splice', () => {
    const updated = update(initial, ['splice', [1, 1, 'A', 'B', 'C']]);

    expect(updated).equals(['a', 'A', 'B', 'C', 'c']);
    expect(updated).not(same(initial));
  });

  it('applies multiple splices in sequence', () => {
    const updated = update(initial, ['splice', [1, 1, 'A', 'B', 'C'], [2, 1]]);

    expect(updated).equals(['a', 'A', 'C', 'c']);
  });

  it('does nothing if the splice call has no effect', () => {
    const updated = update(initial, ['splice', [1, 0]]);

    expect(updated).same(initial);
  });
});
