const defaultContext = require('../index');

const initial = {
  foo: 'bar',
  zig: 'zag',
  value: 5,
};

function matches(condition, state = initial, context = defaultContext) {
  const updatedState = context.update(
    state,
    ['updateIf', condition, ['set', 'match']]
  );
  return updatedState === 'match';
}

describe('unknown condition', () => {
  it('is rejected', () => {
    expect(() => matches({key: 'foo', nope: 'bar'}))
      .toThrow('unknown condition type: nope');
  });
});

describe('empty condition', () => {
  it('is rejected', () => {
    expect(() => matches({})).toThrow('invalid condition');
    expect(() => matches([])).toThrow('empty condition');
    expect(() => matches([{}])).toThrow('invalid condition');
  });
});

describe('key presence', () => {
  it('matches', () => {
    expect(matches({key: 'value'})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'nope'})).toEqual(false);
  });

  it('matches falsy but non-nullish values', () => {
    expect(matches({key: 'value'}, {value: 0})).toEqual(true);
    expect(matches({key: 'value'}, {value: false})).toEqual(true);
  });

  it('does not match nullish values', () => {
    expect(matches({key: 'value'}, {value: null})).toEqual(false);
    expect(matches({key: 'value'}, {value: undefined})).toEqual(false);
  });

  it('does not match __proto__', () => {
    expect(matches({key: '__proto__'})).toEqual(false);
  });
});

describe('equals', () => {
  it('matches', () => {
    expect(matches({equals: 'bar'}, 'bar')).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({equals: 'nope'}, 'bar')).toEqual(false);
  });
});

describe('key equals', () => {
  it('matches', () => {
    expect(matches({key: 'foo', equals: 'bar'})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'foo', equals: 'nope'})).toEqual(false);
  });

  it('checks missing properties', () => {
    expect(matches({key: 'nope', equals: 'nope'})).toEqual(false);
    expect(matches({key: 'nope', equals: null})).toEqual(false);
    expect(matches({key: 'nope', equals: undefined})).toEqual(true);
  });

  it('matches __proto__ as undefined', () => {
    expect(matches({key: '__proto__', equals: null})).toEqual(false);
    expect(matches({key: '__proto__', equals: undefined})).toEqual(true);
  });
});

describe('key equals shorthand', () => {
  it('matches', () => {
    expect(matches(['foo', 'bar'])).toEqual(true);
  });

  it('does not match', () => {
    expect(matches(['foo', 'nope'])).toEqual(false);
  });
});

describe('key not', () => {
  it('matches', () => {
    expect(matches({key: 'foo', not: 'nope'})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'foo', not: 'bar'})).toEqual(false);
  });

  it('checks missing properties', () => {
    expect(matches({key: 'nope', not: 'nope'})).toEqual(true);
    expect(matches({key: 'nope', not: null})).toEqual(true);
    expect(matches({key: 'nope', not: undefined})).toEqual(false);
  });

  it('matches __proto__ as undefined', () => {
    expect(matches({key: '__proto__', not: null})).toEqual(true);
    expect(matches({key: '__proto__', not: undefined})).toEqual(false);
  });
});

describe('key greaterThan', () => {
  it('matches', () => {
    expect(matches({key: 'value', greaterThan: 4})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'value', greaterThan: 5})).toEqual(false);
  });

  it('checks missing properties', () => {
    expect(matches({key: 'nope', greaterThan: 1})).toEqual(false);
    expect(matches({key: 'nope', greaterThan: -1})).toEqual(false);
  });
});

describe('key lessThan', () => {
  it('matches', () => {
    expect(matches({key: 'value', lessThan: 6})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'value', lessThan: 5})).toEqual(false);
  });

  it('checks missing properties', () => {
    expect(matches({key: 'nope', lessThan: 1})).toEqual(false);
    expect(matches({key: 'nope', lessThan: -1})).toEqual(false);
  });
});

describe('key greaterThanOrEqual', () => {
  it('matches', () => {
    expect(matches({key: 'value', greaterThanOrEqual: 5})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'value', greaterThanOrEqual: 6})).toEqual(false);
  });

  it('checks missing properties', () => {
    expect(matches({key: 'nope', greaterThanOrEqual: 1})).toEqual(false);
    expect(matches({key: 'nope', greaterThanOrEqual: -1})).toEqual(false);
  });
});

describe('key lessThanOrEqual', () => {
  it('matches', () => {
    expect(matches({key: 'value', lessThanOrEqual: 5})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'value', lessThanOrEqual: 4})).toEqual(false);
  });

  it('checks missing properties', () => {
    expect(matches({key: 'nope', lessThanOrEqual: 1})).toEqual(false);
    expect(matches({key: 'nope', lessThanOrEqual: -1})).toEqual(false);
  });
});

describe('multiple conditions on a single property', () => {
  it('matches if all conditions match', () => {
    expect(matches({
      key: 'value',
      greaterThan: 2,
      lessThan: 8,
    })).toEqual(true);
  });

  it('does not match if any condition fails', () => {
    expect(matches({
      key: 'value',
      greaterThan: 6,
      lessThan: 8,
    })).toEqual(false);

    expect(matches({
      key: 'value',
      greaterThan: 2,
      lessThan: 4,
    })).toEqual(false);
  });
});

describe('multiple conditions on multiple properties', () => {
  it('matches if all conditions match', () => {
    expect(matches([
      {key: 'foo', equals: 'bar'},
      {key: 'value', greaterThan: 2},
    ])).toEqual(true);
  });

  it('does not match if any condition fails', () => {
    expect(matches([
      {key: 'foo', equals: 'nope'},
      {key: 'value', greaterThan: 2},
    ])).toEqual(false);

    expect(matches([
      {key: 'foo', equals: 'bar'},
      {key: 'value', greaterThan: 10},
    ])).toEqual(false);
  });
});

describe('with', () => {
  it('adds custom conditions', () => {
    const ctx = defaultContext.with({
      conditions: {
        'multiple': (c) => (v) => ((v % c) === 0),
      },
    });

    expect(matches({multiple: 3}, 9, ctx)).toEqual(true);
    expect(matches({multiple: 3}, 10, ctx)).toEqual(false);
  });

  it('preserves existing conditions', () => {
    const ctx = defaultContext.with({
      conditions: {
        'multiple': (c) => (v) => ((v % c) === 0),
      },
    });

    expect(matches({equals: 'bar'}, 'bar', ctx)).toEqual(true);
  });

  it('adds multiple custom conditions', () => {
    const ctx = defaultContext.with({
      conditions: {
        longerThan: (c) => (v) => (v.length > c),
        shorterThan: (c) => (v) => (v.length < c),
      },
    });

    const condition = {longerThan: 3, shorterThan: 5};
    expect(matches(condition, 'abcd', ctx)).toEqual(true);
    expect(matches(condition, 'ab', ctx)).toEqual(false);
    expect(matches(condition, 'abcdef', ctx)).toEqual(false);
  });
});
