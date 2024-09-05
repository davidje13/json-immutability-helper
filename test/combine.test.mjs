import { update } from '../src/index.mjs';

describe('combine', () => {
  it('merges multiple non-conflicting specs', () => {
    const spec = update.combine([{ foo: ['=', 1] }, { bar: ['=', 2] }, { baz: ['=', 3] }]);

    expect(spec).equals({
      foo: ['=', 1],
      bar: ['=', 2],
      baz: ['=', 3],
    });
  });

  it('merges multiple conflicting specs using seq', () => {
    const spec = update.combine([{ foo: ['=', 1] }, { foo: ['=', 2] }]);

    expect(spec).equals({ foo: ['seq', ['=', 1], ['=', 2]] });
  });

  it('merges recursively', () => {
    const spec = update.combine([{ foo: { bar: { baz: ['=', 3] } } }, { foo: { zig: ['=', 4] } }]);

    expect(spec).equals({
      foo: {
        bar: { baz: ['=', 3] },
        zig: ['=', 4],
      },
    });
  });

  it('merges at multiple levels', () => {
    const spec = update.combine([{ foo: { bar: { baz: ['=', 3] } } }, { foo: ['=', 4] }]);

    expect(spec).equals({ foo: ['seq', { bar: { baz: ['=', 3] } }, ['=', 4]] });
  });

  it('generates non-nested sequential operations', () => {
    const spec = update.combine([
      { foo: ['=', 1] },
      { foo: ['=', 2] },
      { foo: ['=', 3] },
      { foo: ['=', 4] },
    ]);

    expect(spec).equals({ foo: ['seq', ['=', 1], ['=', 2], ['=', 3], ['=', 4]] });
  });

  it('flattens sequential operations', () => {
    const spec = update.combine([
      { foo: ['seq', ['=', 1], ['=', 2]] },
      { foo: ['seq', ['=', 3], ['=', 4]] },
    ]);

    expect(spec).equals({ foo: ['seq', ['=', 1], ['=', 2], ['=', 3], ['=', 4]] });
  });

  it('preserves individual actions', () => {
    expect(update.combine([['=', 2]])).equals(['=', 2]);

    expect(update.combine([{ foo: ['=', 2] }])).equals({ foo: ['=', 2] });
  });

  it('combines specs between sequences', () => {
    const spec = update.combine([['seq', ['=', {}], { foo: ['=', 1] }], { bar: ['=', 2] }]);

    expect(spec).equals(['seq', ['=', {}], { foo: ['=', 1], bar: ['=', 2] }]);
  });

  it('generates empty specs if given no meaningful input', () => {
    expect(update.combine([])).equals({});

    expect(update.combine([{}, {}])).equals({});
  });
});
