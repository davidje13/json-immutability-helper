const listCommands = require('../commands/list');
const { update } = require('../index').with(listCommands);

const initial = [10, 9, 11, 9, -1];

describe('swap', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['swap', ['first', { equals: 10 }], ['first', { equals: 11 }]])).throws(
      '/ swap: expected target to be array',
    );
  });

  it('swaps the two matching items', () => {
    const updated = update(initial, ['swap', ['first', { equals: 10 }], ['first', { equals: 11 }]]);
    expect(updated).equals([11, 9, 10, 9, -1]);
  });

  it('does nothing if the first locator matches nothing', () => {
    const updated = update(initial, ['swap', ['first', { equals: 2 }], ['first', { equals: 11 }]]);
    expect(updated).equals([10, 9, 11, 9, -1]);
    expect(updated).same(initial);
  });

  it('does nothing if the second locator matches nothing', () => {
    const updated = update(initial, ['swap', ['first', { equals: 10 }], ['first', { equals: 2 }]]);
    expect(updated).equals([10, 9, 11, 9, -1]);
    expect(updated).same(initial);
  });

  it('does nothing if both locators find the same entry', () => {
    const updated = update(initial, [
      'swap',
      ['first', { equals: 11 }],
      ['last', { greaterThan: 10 }],
    ]);
    expect(updated).equals([10, 9, 11, 9, -1]);
    expect(updated).same(initial);
  });

  it('does nothing if both values are the same', () => {
    const updated = update(initial, ['swap', ['first', { equals: 9 }], ['last', { equals: 9 }]]);
    expect(updated).equals([10, 9, 11, 9, -1]);
    expect(updated).same(initial);
  });
});
