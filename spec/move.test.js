const listCommands = require('../commands/list');
const { update } = require('../index').with(listCommands);

const initial = [10, 9, 11, 9, -1];

describe('move', () => {
  it('operates on arrays', () => {
    expect(() =>
      update(0, ['move', ['first', { equals: 10 }], 'after', ['first', { equals: 11 }]]),
    ).throws('/ move: expected target to be array');
  });

  it('moves the matching item', () => {
    const updated = update(initial, [
      'move',
      ['first', { equals: 10 }],
      'after',
      ['first', { equals: 11 }],
    ]);
    expect(updated).equals([9, 11, 10, 9, -1]);
    expect(updated).not(same(initial));
  });

  it('moves multiple items, preserving order', () => {
    const updated = update(initial, [
      'move',
      ['all', { greaterThan: 9 }],
      'before',
      ['first', { equals: -1 }],
    ]);
    expect(updated).equals([9, 9, 10, 11, -1]);
    expect(updated).not(same(initial));
  });

  it('does nothing if the first locator matches nothing', () => {
    const updated = update(initial, [
      'move',
      ['first', { equals: 2 }],
      'after',
      ['first', { equals: 11 }],
    ]);
    expect(updated).equals([10, 9, 11, 9, -1]);
    expect(updated).same(initial);
  });

  it('does nothing if the second locator matches nothing', () => {
    const updated = update(initial, [
      'move',
      ['first', { equals: 10 }],
      'after',
      ['first', { equals: 2 }],
    ]);
    expect(updated).equals([10, 9, 11, 9, -1]);
    expect(updated).same(initial);
  });

  it('does nothing if both locators find the same entry', () => {
    const updated = update(initial, [
      'move',
      ['first', { equals: 11 }],
      'after',
      ['last', { greaterThan: 10 }],
    ]);
    expect(updated).equals([10, 9, 11, 9, -1]);
    expect(updated).same(initial);
  });
});
