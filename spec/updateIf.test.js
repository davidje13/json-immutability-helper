const update = require('../index');

const initialState = {
  foo: 'bar',
  items: [
    {id: 2, value: 8},
    {id: 4, value: 20},
    {id: 3, value: 30},
    {id: 7, value: 30},
    {id: -1, value: -10},
    {id: 9},
    {value: 6},
  ],
  seven: 7,
};

describe('$updateIf', () => {
  it('applies the given spec if condition is matched', () => {
    const updatedState = update(initialState, {
      $updateIf: [
        {key: 'foo', equals: 'bar'},
        {seven: {$set: 'matched'}},
        {seven: {$set: 'not matched'}},
      ],
    });

    expect(updatedState).not.toBe(initialState);
    expect(updatedState.seven).toEqual('matched');
  });

  it('applies an optional else spec if condition is not matched', () => {
    const updatedState = update(initialState, {
      $updateIf: [
        {key: 'foo', equals: 'nope'},
        {seven: {$set: 'matched'}},
        {seven: {$set: 'not matched'}},
      ],
    });

    expect(updatedState).not.toBe(initialState);
    expect(updatedState.seven).toEqual('not matched');
  });

  it('does nothing if condition is not matched and else is not given', () => {
    const updatedState = update(initialState, {
      $updateIf: [
        {key: 'foo', equals: 'nope'},
        {seven: {$set: 'matched'}},
      ],
    });

    expect(updatedState).toBe(initialState);
  });
});
