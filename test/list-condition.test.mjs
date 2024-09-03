import listCommands from '../src/commands/list.mjs';
import context from '../src/index.mjs';
const listContext = context.with(listCommands);

function matches(condition, state) {
  const updatedState = listContext.update(state, ['if', condition, ['=', 'match']]);
  return updatedState === 'match';
}

describe('length', () => {
  it('matches', () => {
    expect(matches(['length', ['=', 2]], ['def', 'ghi'])).equals(true);
  });

  it('does not match', () => {
    expect(matches(['length', ['=', 2]], ['abc'])).equals(false);
  });

  it('does not match non-arrays', () => {
    expect(matches(['length', ['=', 3]], 'def')).equals(false);
    expect(matches(['length', ['=', 0]], 0)).equals(false);
  });
});

describe('some', () => {
  it('matches', () => {
    expect(matches(['some', ['=', 'abc']], ['abc', 'def'])).equals(true);
  });

  it('does not match', () => {
    expect(matches(['some', ['=', 'nope']], ['abc', 'def'])).equals(false);
  });

  it('does not match non-arrays', () => {
    expect(matches(['some', ['=', 'abc']], 'abc')).equals(false);
  });
});

describe('every', () => {
  it('matches', () => {
    expect(matches(['every', ['=', 'abc']], ['abc', 'abc'])).equals(true);
  });

  it('does not match', () => {
    expect(matches(['every', ['=', 'abc']], ['abc', 'nope'])).equals(false);
  });

  it('does not match non-arrays', () => {
    expect(matches(['every', ['=', 'abc']], 'abc')).equals(false);
  });
});

describe('none', () => {
  it('matches', () => {
    expect(matches(['none', ['=', 'abc']], ['def', 'ghi'])).equals(true);
  });

  it('does not match', () => {
    expect(matches(['none', ['=', 'abc']], ['abc', 'def'])).equals(false);
  });

  it('does not match non-arrays', () => {
    expect(matches(['none', ['=', 'abc']], 'def')).equals(false);
  });
});
