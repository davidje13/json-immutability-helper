import defaultContext from '../src/index.mjs';

const initial = {
  foo: 'bar',
  zig: 'zag',
  value: 5,
};

function matches(condition, state = initial, context = defaultContext) {
  const updatedState = context.update(state, ['if', condition, ['=', 'match']]);
  return updatedState === 'match';
}

describe('equals', () => {
  it('matches identical values', () => {
    expect(matches(['=', 'bar'], 'bar')).equals(true);
    expect(matches(['=', 'bar'], 'nope')).equals(false);

    expect(matches(['=', 2], '2')).equals(false);

    expect(matches(['=', 'foo', 'bar'], 'foo')).equals(true);
    expect(matches(['=', 'foo', 'bar'], 'bar')).equals(true);
    expect(matches(['=', 'foo', 'bar'], 'baz')).equals(false);
  });
});

describe('not equals', () => {
  it('rejects identical values', () => {
    expect(matches(['!=', 'bar'], 'bar')).equals(false);
    expect(matches(['!=', 'bar'], 'nope')).equals(true);

    expect(matches(['!=', 2], '2')).equals(true);

    expect(matches(['!=', 'foo', 'bar'], 'foo')).equals(false);
    expect(matches(['!=', 'foo', 'bar'], 'bar')).equals(false);
    expect(matches(['!=', 'foo', 'bar'], 'baz')).equals(true);
  });
});

describe('loose equals', () => {
  it('matches similar values', () => {
    expect(matches(['~=', 'bar'], 'bar')).equals(true);
    expect(matches(['~=', 'bar'], 'nope')).equals(false);

    expect(matches(['~=', 2], '2')).equals(true);
    expect(matches(['~=', 2], '3')).equals(false);

    expect(matches(['~=', 2, 3], '2')).equals(true);
  });
});

describe('not loose equals', () => {
  it('rejects similar values', () => {
    expect(matches(['!~=', 'bar'], 'bar')).equals(false);
    expect(matches(['!~=', 'bar'], 'nope')).equals(true);

    expect(matches(['!~=', 2], '2')).equals(false);
    expect(matches(['!~=', 2], '3')).equals(true);

    expect(matches(['!~=', 2, 3], '2')).equals(false);
  });
});

describe('greater than', () => {
  it('matches numbers strictly greater', () => {
    expect(matches(['>', 2], 1)).equals(false);
    expect(matches(['>', 2], 2)).equals(false);
    expect(matches(['>', 2], 3)).equals(true);
  });
});

describe('greater than or equal', () => {
  it('matches numbers greater or equal', () => {
    expect(matches(['>=', 2], 1)).equals(false);
    expect(matches(['>=', 2], 2)).equals(true);
    expect(matches(['>=', 2], 3)).equals(true);
  });
});

describe('less than', () => {
  it('matches numbers strictly less', () => {
    expect(matches(['<', 2], 1)).equals(true);
    expect(matches(['<', 2], 2)).equals(false);
    expect(matches(['<', 2], 3)).equals(false);
  });
});

describe('less than or equal', () => {
  it('matches numbers less or equal', () => {
    expect(matches(['<=', 2], 1)).equals(true);
    expect(matches(['<=', 2], 2)).equals(true);
    expect(matches(['<=', 2], 3)).equals(false);
  });
});

describe('nested access', () => {
  it('matches properties', () => {
    expect(matches({ foo: ['=', 'bar'] })).equals(true);
    expect(matches({ foo: ['=', 'nope'] })).equals(false);

    expect(matches({ foo: ['=', 'bar'], zig: ['=', 'zag'] })).equals(true);
    expect(matches({ foo: ['=', 'bar'], zig: ['=', 'nope'] })).equals(false);
    expect(matches({ foo: ['=', 'nope'], zig: ['=', 'zag'] })).equals(false);

    expect(matches({ nope: ['=', 'bar'] })).equals(false);
    expect(matches({ nope: ['=', null] })).equals(false);
    expect(matches({ nope: ['=', undefined] })).equals(true);
  });

  it('does not match __proto__', () => {
    expect(matches(JSON.parse('{"__proto__": ["=", null]}'))).equals(false);
    expect(matches(JSON.parse('{"__proto__": ["not", ["exists"]]}'))).equals(true);
  });
});

describe('and', () => {
  it('matches if all conditions match', () => {
    expect(matches(['and', ['=', 'bar'], ['!=', 'baz']], 'bar')).equals(true);
    expect(matches(['and', ['=', 'bar'], ['=', 'baz']], 'bar')).equals(false);
    expect(matches(['and', ['=', 'bar'], ['=', 'baz']], 'baz')).equals(false);
    expect(matches(['and', ['=', 'bar'], ['=', 'baz']], 'nope')).equals(false);
    expect(matches(['and'], 'bar')).equals(true); // matches with no conditions
  });
});

describe('or', () => {
  it('matches if any conditions match', () => {
    expect(matches(['or', ['=', 'bar'], ['!=', 'baz']], 'bar')).equals(true);
    expect(matches(['or', ['=', 'bar'], ['=', 'baz']], 'bar')).equals(true);
    expect(matches(['or', ['=', 'bar'], ['=', 'baz']], 'baz')).equals(true);
    expect(matches(['or', ['=', 'bar'], ['=', 'baz']], 'nope')).equals(false);
    expect(matches(['or'], 'bar')).equals(false); // no match with no conditions
  });
});

describe('not', () => {
  it('matches if the sub-condition does not match', () => {
    expect(matches(['not', ['=', 'bar']], 'bar')).equals(false);
    expect(matches(['not', ['=', 'bar']], 'nope')).equals(true);
  });
});

describe('exists', () => {
  it('matches values which are set', () => {
    expect(matches({ value: ['exists'] })).equals(true);
    expect(matches({ value: ['exists'] }, { value: 0 })).equals(true);
    expect(matches({ value: ['exists'] }, { value: false })).equals(true);
    expect(matches({ value: ['exists'] }, { value: null })).equals(true);

    expect(matches({ nope: ['exists'] })).equals(false);
    expect(matches({ value: ['exists'] }, { value: undefined })).equals(false);
  });

  it('does not match __proto__', () => {
    expect(matches(JSON.parse('{"__proto__": ["exists"]}'))).equals(false);
  });
});

describe('with', () => {
  it('adds custom conditions', () => {
    const ctx = defaultContext.with({
      conditions: {
        multiple: (c) => (v) => v % c === 0,
      },
    });

    expect(matches(['multiple', 3], 9, ctx)).equals(true);
    expect(matches(['multiple', 3], 10, ctx)).equals(false);
  });

  it('preserves existing conditions', () => {
    const ctx = defaultContext.with({
      conditions: {
        multiple: (c) => (v) => v % c === 0,
      },
    });

    expect(matches(['=', 'bar'], 'bar', ctx)).equals(true);
  });

  it('adds multiple custom conditions', () => {
    const ctx = defaultContext.with({
      conditions: {
        longerThan: (c) => (v) => v.length > c,
        shorterThan: (c) => (v) => v.length < c,
      },
    });

    const condition = ['and', ['longerThan', 3], ['shorterThan', 5]];
    expect(matches(condition, 'abcd', ctx)).equals(true);
    expect(matches(condition, 'ab', ctx)).equals(false);
    expect(matches(condition, 'abcdef', ctx)).equals(false);
  });
});

it('rejects unknown conditions', () => {
  expect(() => matches(7)).throws('expected [command, condition, spec, spec?]');

  expect(() => matches(null)).throws('invalid condition');

  expect(() => matches(['nope', 'bar'])).throws('unknown condition type: nope');

  expect(() => matches([])).throws('unknown condition type: undefined');
});

it('rejects unknown sub-conditions', () => {
  expect(() => matches({ foo: 7 })).throws('invalid condition');

  expect(() => matches({ foo: null })).throws('invalid condition');

  expect(() => matches({ foo: ['nope', 'bar'] })).throws('unknown condition type: nope');

  expect(() => matches({ foo: [] })).throws('unknown condition type: undefined');
});
