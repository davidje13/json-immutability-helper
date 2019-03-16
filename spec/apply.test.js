const update = require('../index');

describe('$apply', () => {
  it('is rejected', () => {
    expect(() => update({}, {$apply: () => 'nope'})).toThrow();
  });

  it('is rejected in shorthand form', () => {
    expect(() => update({}, () => 'nope')).toThrow();
  });
});
