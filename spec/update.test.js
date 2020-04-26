const update = require('../index');

const initial = [10, 9, 11, 9, -1];
const spec = ['=', 2];

describe('updateAll', () => {
  it('applies an update to all items in a list', () => {
    const updated = update(initial, ['updateAll', spec]);

    expect(updated).toEqual([2, 2, 2, 2, 2]);
  });
});

describe('updateWhere', () => {
  it('applies an update to all matching items in a list', () => {
    const updated = update(initial, ['updateWhere', {equals: 9}, spec]);

    expect(updated).toEqual([10, 2, 11, 2, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['updateWhere', {equals: 1}, spec]);

    expect(updated).toBe(initial);
  });
});

describe('updateFirstWhere', () => {
  it('applies an update to the first matching item in a list', () => {
    const updated = update(initial, ['updateFirstWhere', {equals: 9}, spec]);

    expect(updated).toEqual([10, 2, 11, 9, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['updateFirstWhere', {equals: 1}, spec]);

    expect(updated).toBe(initial);
  });
});

describe('updateLastWhere', () => {
  it('applies an update to the last matching item in a list', () => {
    const updated = update(initial, ['updateLastWhere', {equals: 9}, spec]);

    expect(updated).toEqual([10, 9, 11, 2, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['updateLastWhere', {equals: 1}, spec]);

    expect(updated).toBe(initial);
  });
});
