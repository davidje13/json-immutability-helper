const update = require('../index');

const initialState = {
  foo: 'bar',
  seven: 7,
};

describe('$seq', () => {
  it('applies all specs', () => {
    const updatedState = update(initialState, {
      $seq: [
        { foo: { $set: 'baz' } },
        { seven: { $set: 8 } },
      ],
    });

    expect(updatedState).not.toBe(initialState);
    expect(updatedState).toEqual({ foo: 'baz', seven: 8 });
  });

  it('applies specs sequentially to the current property', () => {
    const updatedState = update(initialState, {
      seven: {
        $seq: [
          { $add: 5 },
          { $multiply: 2 },
        ],
      },
    });

    expect(updatedState).toEqual({ foo: 'bar', seven: 24 });
  });
});
