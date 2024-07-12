const listCommands = require('../commands/list');
const defaultContext = require('../index').with(listCommands);

function matches(condition, state, context = defaultContext) {
  const updatedState = context.update(state, ['updateIf', condition, ['set', 'match']]);
  return updatedState === 'match';
}

describe('contains', () => {
  it('matches', () => {
    expect(matches({ contains: { equals: 'abc' } }, ['abc', 'def'])).equals(true);
  });

  it('allows recursive shorthand', () => {
    expect(matches({ contains: ['foo', 'bar'] }, [{ foo: 'bar' }])).equals(true);
    expect(matches({ contains: ['foo', 'bar'] }, [{ foo: 'nope' }])).equals(false);
  });

  it('does not match', () => {
    expect(matches({ contains: { equals: 'nope' } }, ['abc', 'def'])).equals(false);
  });

  it('does not match non-arrays', () => {
    expect(matches({ contains: { equals: 'nope' } }, 'nope')).equals(false);
  });
});

describe('notContains', () => {
  it('matches', () => {
    expect(matches({ notContains: { equals: 'nope' } }, ['abc', 'def'])).equals(true);
  });

  it('does not match', () => {
    expect(matches({ notContains: { equals: 'abc' } }, ['abc', 'def'])).equals(false);
  });

  it('matches non-arrays', () => {
    expect(matches({ notContains: { equals: 'nope' } }, 'nope')).equals(true);
  });
});
