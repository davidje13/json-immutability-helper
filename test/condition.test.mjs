import defaultContext from '../src/index.mjs';

const initial = {
  foo: 'bar',
  zig: 'zag',
  value: 5,
};

function matches(condition, state = initial, context = defaultContext) {
  const updatedState = context.update(state, ['updateIf', condition, ['set', 'match']]);
  return updatedState === 'match';
}

describe('unknown condition', () => {
  it('is rejected', () => {
    expect(() => matches({ key: 'foo', nope: 'bar' })).throws('unknown condition type: nope');
  });
});

describe('empty condition', () => {
  it('is rejected', () => {
    expect(() => matches({})).throws('invalid condition');
    expect(() => matches([])).throws('empty condition');
    expect(() => matches([{}])).throws('invalid condition');
  });
});

describe('key presence', () => {
  it('matches', () => {
    expect(matches({ key: 'value' })).equals(true);
  });

  it('does not match', () => {
    expect(matches({ key: 'nope' })).equals(false);
  });

  it('matches falsy but non-nullish values', () => {
    expect(matches({ key: 'value' }, { value: 0 })).equals(true);
    expect(matches({ key: 'value' }, { value: false })).equals(true);
  });

  it('does not match nullish values', () => {
    expect(matches({ key: 'value' }, { value: null })).equals(false);
    expect(matches({ key: 'value' }, { value: undefined })).equals(false);
  });

  it('does not match __proto__', () => {
    expect(matches({ key: '__proto__' })).equals(false);
  });
});

describe('equals', () => {
  it('matches', () => {
    expect(matches({ equals: 'bar' }, 'bar')).equals(true);
  });

  it('does not match', () => {
    expect(matches({ equals: 'nope' }, 'bar')).equals(false);
  });
});

describe('key equals', () => {
  it('matches', () => {
    expect(matches({ key: 'foo', equals: 'bar' })).equals(true);
  });

  it('does not match', () => {
    expect(matches({ key: 'foo', equals: 'nope' })).equals(false);
  });

  it('checks missing properties', () => {
    expect(matches({ key: 'nope', equals: 'nope' })).equals(false);
    expect(matches({ key: 'nope', equals: null })).equals(false);
    expect(matches({ key: 'nope', equals: undefined })).equals(true);
  });

  it('matches __proto__ as undefined', () => {
    expect(matches({ key: '__proto__', equals: null })).equals(false);
    expect(matches({ key: '__proto__', equals: undefined })).equals(true);
  });
});

describe('key equals shorthand', () => {
  it('matches', () => {
    expect(matches(['foo', 'bar'])).equals(true);
  });

  it('does not match', () => {
    expect(matches(['foo', 'nope'])).equals(false);
  });
});

describe('key not', () => {
  it('matches', () => {
    expect(matches({ key: 'foo', not: 'nope' })).equals(true);
  });

  it('does not match', () => {
    expect(matches({ key: 'foo', not: 'bar' })).equals(false);
  });

  it('checks missing properties', () => {
    expect(matches({ key: 'nope', not: 'nope' })).equals(true);
    expect(matches({ key: 'nope', not: null })).equals(true);
    expect(matches({ key: 'nope', not: undefined })).equals(false);
  });

  it('matches __proto__ as undefined', () => {
    expect(matches({ key: '__proto__', not: null })).equals(true);
    expect(matches({ key: '__proto__', not: undefined })).equals(false);
  });
});

describe('key greaterThan', () => {
  it('matches', () => {
    expect(matches({ key: 'value', greaterThan: 4 })).equals(true);
  });

  it('does not match', () => {
    expect(matches({ key: 'value', greaterThan: 5 })).equals(false);
  });

  it('checks missing properties', () => {
    expect(matches({ key: 'nope', greaterThan: 1 })).equals(false);
    expect(matches({ key: 'nope', greaterThan: -1 })).equals(false);
  });
});

describe('key lessThan', () => {
  it('matches', () => {
    expect(matches({ key: 'value', lessThan: 6 })).equals(true);
  });

  it('does not match', () => {
    expect(matches({ key: 'value', lessThan: 5 })).equals(false);
  });

  it('checks missing properties', () => {
    expect(matches({ key: 'nope', lessThan: 1 })).equals(false);
    expect(matches({ key: 'nope', lessThan: -1 })).equals(false);
  });
});

describe('key greaterThanOrEqual', () => {
  it('matches', () => {
    expect(matches({ key: 'value', greaterThanOrEqual: 5 })).equals(true);
  });

  it('does not match', () => {
    expect(matches({ key: 'value', greaterThanOrEqual: 6 })).equals(false);
  });

  it('checks missing properties', () => {
    expect(matches({ key: 'nope', greaterThanOrEqual: 1 })).equals(false);
    expect(matches({ key: 'nope', greaterThanOrEqual: -1 })).equals(false);
  });
});

describe('key lessThanOrEqual', () => {
  it('matches', () => {
    expect(matches({ key: 'value', lessThanOrEqual: 5 })).equals(true);
  });

  it('does not match', () => {
    expect(matches({ key: 'value', lessThanOrEqual: 4 })).equals(false);
  });

  it('checks missing properties', () => {
    expect(matches({ key: 'nope', lessThanOrEqual: 1 })).equals(false);
    expect(matches({ key: 'nope', lessThanOrEqual: -1 })).equals(false);
  });
});

describe('multiple conditions on a single property', () => {
  it('matches if all conditions match', () => {
    expect(
      matches({
        key: 'value',
        greaterThan: 2,
        lessThan: 8,
      }),
    ).equals(true);
  });

  it('does not match if any condition fails', () => {
    expect(
      matches({
        key: 'value',
        greaterThan: 6,
        lessThan: 8,
      }),
    ).equals(false);

    expect(
      matches({
        key: 'value',
        greaterThan: 2,
        lessThan: 4,
      }),
    ).equals(false);
  });
});

describe('multiple conditions on multiple properties', () => {
  it('matches if all conditions match', () => {
    expect(
      matches([
        { key: 'foo', equals: 'bar' },
        { key: 'value', greaterThan: 2 },
      ]),
    ).equals(true);
  });

  it('does not match if any condition fails', () => {
    expect(
      matches([
        { key: 'foo', equals: 'nope' },
        { key: 'value', greaterThan: 2 },
      ]),
    ).equals(false);

    expect(
      matches([
        { key: 'foo', equals: 'bar' },
        { key: 'value', greaterThan: 10 },
      ]),
    ).equals(false);
  });
});

describe('with', () => {
  it('adds custom conditions', () => {
    const ctx = defaultContext.with({
      conditions: {
        multiple: (c) => (v) => v % c === 0,
      },
    });

    expect(matches({ multiple: 3 }, 9, ctx)).equals(true);
    expect(matches({ multiple: 3 }, 10, ctx)).equals(false);
  });

  it('preserves existing conditions', () => {
    const ctx = defaultContext.with({
      conditions: {
        multiple: (c) => (v) => v % c === 0,
      },
    });

    expect(matches({ equals: 'bar' }, 'bar', ctx)).equals(true);
  });

  it('adds multiple custom conditions', () => {
    const ctx = defaultContext.with({
      conditions: {
        longerThan: (c) => (v) => v.length > c,
        shorterThan: (c) => (v) => v.length < c,
      },
    });

    const condition = { longerThan: 3, shorterThan: 5 };
    expect(matches(condition, 'abcd', ctx)).equals(true);
    expect(matches(condition, 'ab', ctx)).equals(false);
    expect(matches(condition, 'abcdef', ctx)).equals(false);
  });
});
