const update = require('../index');

const initialState = [10, 9, 11, 9, -1];

describe('$deleteWhere', () => {
  it('deletes all matching items in a list', () => {
    const updatedState = update(initialState, {
      $deleteWhere: {equals: 9},
    });

    expect(updatedState).toEqual([10, 11, -1]);
  });

  it('does nothing if no items match', () => {
    const updatedState = update(initialState, {
      $deleteWhere: {equals: 100},
    });

    expect(updatedState).toBe(initialState);
  });
});

describe('$deleteFirstWhere', () => {
  it('deletes the first matching item in a list', () => {
    const updatedState = update(initialState, {
      $deleteFirstWhere: {equals: 9},
    });

    expect(updatedState).toEqual([10, 11, 9, -1]);
  });

  it('does nothing if no items match', () => {
    const updatedState = update(initialState, {
      $deleteFirstWhere: {equals: 100},
    });

    expect(updatedState).toBe(initialState);
  });
});

describe('$deleteLastWhere', () => {
  it('deletes the last matching item in a list', () => {
    const updatedState = update(initialState, {
      $deleteLastWhere: {equals: 9},
    });

    expect(updatedState).toEqual([10, 9, 11, -1]);
  });

  it('does nothing if no items match', () => {
    const updatedState = update(initialState, {
      $deleteLastWhere: {equals: 100},
    });

    expect(updatedState).toBe(initialState);
  });
});
