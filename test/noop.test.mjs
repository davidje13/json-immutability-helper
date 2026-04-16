import { update } from '../src/index.mjs';

describe('noop', () => {
  it(
    'applies to all input types',
    (type) => {
      expect(update(type, {})).equals(type);
      expect(update(type, ['seq'])).equals(type);
    },
    {
      parameters: [undefined, null, true, false, 0, 1, '', 'a', {}, [], { a: 1 }, [1], [{ a: 1 }]],
    },
  );
});

describe('isNoOp', () => {
  it('returns true for empty operations', () => {
    expect(update.isNoOp({})).isTrue();
    expect(update.isNoOp(['seq'])).isTrue();
    expect(update.isNoOp(update.combine([]))).isTrue();
  });

  it('returns false for meaningful operations', () => {
    expect(update.isNoOp(['=', 1])).isFalse();
    expect(update.isNoOp({ a: ['=', 1] })).isFalse();
    expect(update.isNoOp(['seq', ['=', 1]])).isFalse();
  });
});
