const { update } = require('../index');

const initial = {
  foo: 'bar',
  seven: 7,
};

describe('seq', () => {
  it('applies all specs', () => {
    const updated = update(initial, [
      'seq',
      { foo: ['=', 'baz'] },
      { seven: ['=', 8] },
    ]);

    expect(updated).not(same(initial));
    expect(updated).equals({ foo: 'baz', seven: 8 });
  });

  it('applies specs sequentially to the current property', () => {
    const updated = update(initial, {
      seven: ['seq', ['add', 5], ['subtract', 2]],
    });

    expect(updated).equals({ foo: 'bar', seven: 10 });
  });
});
