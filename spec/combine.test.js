const update = require('../index');

describe('combine', () => {
  it('merges multiple non-conflicting specs', () => {
    const spec = update.combine([
      { foo: { $set: 1 } },
      { bar: { $set: 2 } },
      { baz: { $set: 3 } },
    ]);

    expect(spec).toEqual({
      foo: { $set: 1 },
      bar: { $set: 2 },
      baz: { $set: 3 },
    });
  });

  it('merges multiple conflicting specs using $seq', () => {
    const spec = update.combine([
      { foo: { $set: 1 } },
      { foo: { $set: 2 } },
    ]);

    expect(spec).toEqual({ foo: { $seq: [{ $set: 1 }, { $set: 2 }] } });
  });

  it('merges recursively', () => {
    const spec = update.combine([
      { foo: { bar: { baz: { $set: 3 } } } },
      { foo: { zig: { $set: 4 } } },
    ]);

    expect(spec).toEqual({ foo: {
      bar: { baz: { $set: 3 } },
      zig: { $set: 4 },
    } });
  });

  it('merges at multiple levels', () => {
    const spec = update.combine([
      { foo: { bar: { baz: { $set: 3 } } } },
      { foo: { $set: 4 } },
    ]);

    expect(spec).toEqual({ foo: { $seq: [
      { bar: { baz: { $set: 3 } } },
      { $set: 4 },
    ] } });
  });

  it('generates non-nested sequential operations', () => {
    const spec = update.combine([
      { foo: { $set: 1 } },
      { foo: { $set: 2 } },
      { foo: { $set: 3 } },
      { foo: { $set: 4 } },
    ]);

    expect(spec).toEqual({ foo: { $seq: [
      { $set: 1 },
      { $set: 2 },
      { $set: 3 },
      { $set: 4 },
    ] } });
  });

  it('flattens sequential operations', () => {
    const spec = update.combine([
      { foo: { $seq: [{ $set: 1 }, { $set: 2 }] } },
      { foo: { $seq: [{ $set: 3 }, { $set: 4 }] } },
    ]);

    expect(spec).toEqual({ foo: { $seq: [
      { $set: 1 },
      { $set: 2 },
      { $set: 3 },
      { $set: 4 },
    ] } });
  });
});
