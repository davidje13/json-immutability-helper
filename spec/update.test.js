const update = require('../index');

const initialState = [10, 9, 11, 9, -1];

describe('$updateAll', () => {
  it('applies an update to all items in a list', () => {
    const updatedState = update(initialState, {
      $updateAll: {$set: 2},
    });

    expect(updatedState).toEqual([2, 2, 2, 2, 2]);
  });
});

describe('$updateWhere', () => {
  it('applies an update to all matching items in a list', () => {
    const updatedState = update(initialState, {
      $updateWhere: [
        {equals: 9},
        {$set: 2},
      ],
    });

    expect(updatedState).toEqual([10, 2, 11, 2, -1]);
  });

  it('does nothing if no items match', () => {
    const updatedState = update(initialState, {
      $updateWhere: [
        {equals: 100},
        {$set: 2},
      ],
    });

    expect(updatedState).toBe(initialState);
  });
});

describe('$updateFirstWhere', () => {
  it('applies an update to the first matching item in a list', () => {
    const updatedState = update(initialState, {
      $updateFirstWhere: [
        {equals: 9},
        {$set: 2},
      ],
    });

    expect(updatedState).toEqual([10, 2, 11, 9, -1]);
  });

  it('does nothing if no items match', () => {
    const updatedState = update(initialState, {
      $updateFirstWhere: [
        {equals: 100},
        {$set: 2},
      ],
    });

    expect(updatedState).toBe(initialState);
  });
});

describe('$updateLastWhere', () => {
  it('applies an update to the last matching item in a list', () => {
    const updatedState = update(initialState, {
      $updateLastWhere: [
        {equals: 9},
        {$set: 2},
      ],
    });

    expect(updatedState).toEqual([10, 9, 11, 2, -1]);
  });

  it('does nothing if no items match', () => {
    const updatedState = update(initialState, {
      $updateLastWhere: [
        {equals: 100},
        {$set: 2},
      ],
    });

    expect(updatedState).toBe(initialState);
  });
});
