const update = require('../index');

const initial = {
  foo: 'bar',
  items: [
    { id: 2, value: 8 },
    { id: 4, value: 20 },
    { id: 3, value: 30 },
    { id: 7, value: 30 },
    { id: -1, value: -10 },
    { id: 9 },
    { value: 6 },
  ],
  seven: 7,
};

const matchSpec = { seven: ['=', 'matched'] };
const elseSpec = { seven: ['=', 'not matched'] };

describe('updateIf', () => {
  it('applies the given spec if condition is matched', () => {
    const updated = update(initial, [
      'updateIf',
      { key: 'foo', equals: 'bar' },
      matchSpec,
      elseSpec,
    ]);

    expect(updated).not.toBe(initial);
    expect(updated.seven).toEqual('matched');
  });

  it('applies an optional else spec if condition is not matched', () => {
    const updated = update(initial, [
      'updateIf',
      { key: 'foo', equals: 'nope' },
      matchSpec,
      elseSpec,
    ]);

    expect(updated).not.toBe(initial);
    expect(updated.seven).toEqual('not matched');
  });

  it('does nothing if condition is not matched and else is not given', () => {
    const updated = update(initial, [
      'updateIf',
      { key: 'foo', equals: 'nope' },
      matchSpec,
    ]);

    expect(updated).toBe(initial);
  });
});
