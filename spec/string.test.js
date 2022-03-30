const mathCommands = require('../commands/math');
const stringCommands = require('../commands/string');
const { update } = require('../index').with(mathCommands, stringCommands);

describe('replaceAll with stringCommands', () => {
  it('operates on strings', () => {
    expect(() => update(0, ['replaceAll', '', '']))
      .throws('/ replaceAll: expected target to be string');
  });

  it('takes 2 arguments', () => {
    expect(() => update('', ['replaceAll']))
      .throws('/ replaceAll: expected [command, find, replace]');
  });

  it('replaces all occurrences of a string', () => {
    const initial = 'this is a message';

    const updated = update(initial, ['replaceAll', 'a', 'A']);

    expect(updated).equals('this is A messAge');
  });

  it('does nothing if the input string is blank', () => {
    const initial = 'this is a message';

    const updated = update(initial, ['replaceAll', '', 'A']);

    expect(updated).equals(initial);
  });

  it('does nothing if no matches are found', () => {
    const initial = 'this is a message';

    const updated = update(initial, ['replaceAll', 'x', 'A']);

    expect(updated).equals(initial);
  });

  it('does nothing if find and replace are identical', () => {
    const initial = 'this is a message';

    const updated = update(initial, ['replaceAll', 'is', 'is']);

    expect(updated).equals(initial);
  });

  it('replaces touching occurrences', () => {
    const initial = 'aaaaa';

    const updated = update(initial, ['replaceAll', 'a', 'bB']);

    expect(updated).equals('bBbBbBbBbB');
  });

  it('does not replace recursively', () => {
    const initial = 'foo bar baz';

    const updated = update(initial, ['replaceAll', 'bar', 'foo bar baz']);

    expect(updated).equals('foo foo bar baz baz');
  });

  it('does not interpret inputs as regular expressions', () => {
    const initial = 'vowels are [aeiou]';

    const updated = update(initial, ['replaceAll', '[aeiou]', 'letters']);

    expect(updated).equals('vowels are letters');
  });
});

describe('rpn with stringCommands', () => {
  it('operates on numbers and strings', () => {
    expect(() => update([], ['rpn']))
      .throws('/ rpn: expected target to be primitive');
  });

  it('rejects changes of type', () => {
    expect(() => update('abc', ['rpn', 7]))
      .throws('cannot change type of property');

    expect(() => update(7, ['rpn', '"abc"']))
      .throws('cannot change type of property');
  });

  it('can return a string', () => {
    const result = update('', ['rpn', '"abc"']);
    expect(result).equals('abc');
  });

  it('provides the original string value as x', () => {
    const result = update('abcdefg', ['rpn', 'x', 2, -2, 'slice:3']);
    expect(result).equals('cde');
  });

  it('allows string operations', () => {
    const result = update(0, ['rpn', 2, 'String', 'Number']);
    expect(result).equals(2);
  });

  it('uses mathematical addition', () => {
    const result = update('', ['rpn', '"2"', '"3"', '+', 'String']);
    expect(result).equals('5');
  });

  it('allows string concatenation', () => {
    const result = update('', ['rpn', '"2"', '"3"', 'concat']);
    expect(result).equals('23');
  });
});
