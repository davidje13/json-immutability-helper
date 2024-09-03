import { update } from '../src/index.mjs';

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

describe('if', () => {
  it('applies the given spec if condition is matched', () => {
    const updated = update(initial, ['if', { foo: ['=', 'bar'] }, matchSpec, elseSpec]);

    expect(updated).not(same(initial));
    expect(updated.seven).equals('matched');
  });

  it('applies an optional else spec if condition is not matched', () => {
    const updated = update(initial, ['if', { foo: ['=', 'nope'] }, matchSpec, elseSpec]);

    expect(updated).not(same(initial));
    expect(updated.seven).equals('not matched');
  });

  it('does nothing if condition is not matched and else is not given', () => {
    const updated = update(initial, ['if', { foo: ['=', 'nope'] }, matchSpec]);

    expect(updated).same(initial);
  });
});
