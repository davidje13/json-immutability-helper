import { update } from '../src/index.mjs';

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
