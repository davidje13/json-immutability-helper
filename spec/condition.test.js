const { Context } = require('../index');

const context = new Context();

const initial = {
  foo: 'bar',
  zig: 'zag',
  value: 5,
};

function matches(condition, state = initial) {
  const updatedState = context.update([state], ['deleteWhere', condition]);

  return updatedState.length === 0;
}

describe('unknown condition', () => {
  it('is rejected', () => {
    expect(() => matches({key: 'foo', nope: 'bar'})).toThrow();
  });
});

describe('empty condition', () => {
  it('is rejected', () => {
    expect(() => matches({})).toThrow();
    expect(() => matches([])).toThrow();
    expect(() => matches([{}])).toThrow();
  });
});

describe('key presence', () => {
  it('matches', () => {
    expect(matches({key: 'value'})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'nope'})).toEqual(false);
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
});

describe('key greaterThan', () => {
  it('matches', () => {
    expect(matches({key: 'value', greaterThan: 4})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'value', greaterThan: 5})).toEqual(false);
  });
});

describe('key lessThan', () => {
  it('matches', () => {
    expect(matches({key: 'value', lessThan: 6})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'value', lessThan: 5})).toEqual(false);
  });
});

describe('key greaterThanOrEqual', () => {
  it('matches', () => {
    expect(matches({key: 'value', greaterThanOrEqual: 5})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'value', greaterThanOrEqual: 6})).toEqual(false);
  });
});

describe('key lessThanOrEqual', () => {
  it('matches', () => {
    expect(matches({key: 'value', lessThanOrEqual: 5})).toEqual(true);
  });

  it('does not match', () => {
    expect(matches({key: 'value', lessThanOrEqual: 4})).toEqual(false);
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

describe('extendCondition', () => {
  it('adds custom conditions', () => {
    context.extendCondition('multiple', (c) => (v) => ((v % c) === 0));

    expect(matches({multiple: 3}, 9)).toEqual(true);
    expect(matches({multiple: 3}, 10)).toEqual(false);
  });
});

describe('extendConditionAll', () => {
  it('adds multiple custom conditions', () => {
    const longerThan = (c) => (v) => (v.length > c);
    const shorterThan = (c) => (v) => (v.length < c);
    context.extendConditionAll({longerThan, shorterThan});

    expect(matches({longerThan: 3, shorterThan: 5}, 'abcd')).toEqual(true);
    expect(matches({longerThan: 3, shorterThan: 5}, 'ab')).toEqual(false);
    expect(matches({longerThan: 3, shorterThan: 5}, 'abcdef')).toEqual(false);
  });
});
