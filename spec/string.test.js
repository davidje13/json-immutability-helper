const update = require('../index');

describe('replaceAll', () => {
  it('operates on strings', () => {
    expect(() => update(0, ['replaceAll', '', '']))
      .toThrow('/ replaceAll: expected target to be string');
  });

  it('takes 2 arguments', () => {
    expect(() => update('', ['replaceAll']))
      .toThrow('/ replaceAll: expected [command, find, replace]');
  });

  it('replaces all occurrences of a string', () => {
    const initial = 'this is a message';

    const updated = update(initial, ['replaceAll', 'a', 'A']);

    expect(updated).toEqual('this is A messAge');
  });

  it('does not interpret inputs as regular expressions', () => {
    const initial = 'vowels are [aeiou]';

    const updated = update(initial, ['replaceAll', '[aeiou]', 'letters']);

    expect(updated).toEqual('vowels are letters');
  });
});
