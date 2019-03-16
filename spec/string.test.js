const update = require('../index');

describe('$replaceAll', () => {
  it('replaces all occurrences of a string', () => {
    const initialState = 'this is a message';

    const updatedState = update(initialState, {
      $replaceAll: ['a', 'A'],
    });

    expect(updatedState).toEqual('this is A messAge');
  });

  it('does not interpret inputs as regular expressions', () => {
    const initialState = 'vowels are [aeiou]';

    const updatedState = update(initialState, {
      $replaceAll: ['[aeiou]', 'letters'],
    });

    expect(updatedState).toEqual('vowels are letters');
  });
});
