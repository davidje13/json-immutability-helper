const update = require('../index');

const initialState = [10, 9, 11, 9, -1];

describe('$insertBeforeFirstWhere', () => {
  it('inserts new items before the first matching item', () => {
    const updatedState = update(initialState, {
      $insertBeforeFirstWhere: [
        {equals: 9},
        'item-1',
        'item-2',
      ],
    });

    expect(updatedState).toEqual([10, 'item-1', 'item-2', 9, 11, 9, -1]);
  });

  it('inserts at the end if no items match', () => {
    const updatedState = update(initialState, {
      $insertBeforeFirstWhere: [
        {equals: 100},
        'item-1',
        'item-2',
      ],
    });

    expect(updatedState).toEqual([10, 9, 11, 9, -1, 'item-1', 'item-2']);
  });
});

describe('$insertAfterFirstWhere', () => {
  it('inserts new items after the first matching item', () => {
    const updatedState = update(initialState, {
      $insertAfterFirstWhere: [
        {equals: 9},
        'item-1',
        'item-2',
      ],
    });

    expect(updatedState).toEqual([10, 9, 'item-1', 'item-2', 11, 9, -1]);
  });

  it('inserts at the end if no items match', () => {
    const updatedState = update(initialState, {
      $insertAfterFirstWhere: [
        {equals: 100},
        'item-1',
        'item-2',
      ],
    });

    expect(updatedState).toEqual([10, 9, 11, 9, -1, 'item-1', 'item-2']);
  });
});

describe('$insertBeforeLastWhere', () => {
  it('inserts new items before the last matching item', () => {
    const updatedState = update(initialState, {
      $insertBeforeLastWhere: [
        {equals: 9},
        'item-1',
        'item-2',
      ],
    });

    expect(updatedState).toEqual([10, 9, 11, 'item-1', 'item-2', 9, -1]);
  });

  it('inserts at the start if no items match', () => {
    const updatedState = update(initialState, {
      $insertBeforeLastWhere: [
        {equals: 100},
        'item-1',
        'item-2',
      ],
    });

    expect(updatedState).toEqual(['item-1', 'item-2', 10, 9, 11, 9, -1]);
  });
});

describe('$insertAfterLastWhere', () => {
  it('inserts new items after the last matching item', () => {
    const updatedState = update(initialState, {
      $insertAfterLastWhere: [
        {equals: 9},
        'item-1',
        'item-2',
      ],
    });

    expect(updatedState).toEqual([10, 9, 11, 9, 'item-1', 'item-2', -1]);
  });

  it('inserts at the start if no items match', () => {
    const updatedState = update(initialState, {
      $insertAfterLastWhere: [
        {equals: 100},
        'item-1',
        'item-2',
      ],
    });

    expect(updatedState).toEqual(['item-1', 'item-2', 10, 9, 11, 9, -1]);
  });
});
