const update = require('../index');

const initial = [10, 9, 11, 9, -1];

describe('deleteWhere', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['deleteWhere', {equals: 1}]))
      .toThrow('/ deleteWhere: expected target to be array');
  });

  it('takes a condition', () => {
    expect(() => update([], ['deleteWhere']))
      .toThrow('/ deleteWhere: expected [command, condition]');
  });

  it('deletes all matching items in a list', () => {
    const updated = update(initial, ['deleteWhere', {equals: 9}]);

    expect(updated).toEqual([10, 11, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['deleteWhere', {equals: 1}]);

    expect(updated).toBe(initial);
  });
});

describe('deleteFirstWhere', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['deleteFirstWhere', {equals: 1}]))
      .toThrow('/ deleteFirstWhere: expected target to be array');
  });

  it('takes a condition', () => {
    expect(() => update([], ['deleteFirstWhere']))
      .toThrow('/ deleteFirstWhere: expected [command, condition]');
  });

  it('deletes the first matching item in a list', () => {
    const updated = update(initial, ['deleteFirstWhere', {equals: 9}]);

    expect(updated).toEqual([10, 11, 9, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['deleteFirstWhere', {equals: 1}]);

    expect(updated).toBe(initial);
  });
});

describe('deleteLastWhere', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['deleteLastWhere', {equals: 1}]))
      .toThrow('/ deleteLastWhere: expected target to be array');
  });

  it('takes a condition', () => {
    expect(() => update([], ['deleteLastWhere']))
      .toThrow('/ deleteLastWhere: expected [command, condition]');
  });

  it('deletes the last matching item in a list', () => {
    const updated = update(initial, ['deleteLastWhere', {equals: 9}]);

    expect(updated).toEqual([10, 9, 11, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['deleteLastWhere', {equals: 1}]);

    expect(updated).toBe(initial);
  });
});
