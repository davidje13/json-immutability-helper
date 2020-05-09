const { Context } = require('../index');

const context = new Context();
context.enableRiskyStringOps();
const { update } = context;

describe('replaceAll with enableRiskyStringOps', () => {
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

  it('does nothing if the input string is blank', () => {
    const initial = 'this is a message';

    const updated = update(initial, ['replaceAll', '', 'A']);

    expect(updated).toEqual(initial);
  });

  it('does nothing if no matches are found', () => {
    const initial = 'this is a message';

    const updated = update(initial, ['replaceAll', 'x', 'A']);

    expect(updated).toEqual(initial);
  });

  it('does nothing if find and replace are identical', () => {
    const initial = 'this is a message';

    const updated = update(initial, ['replaceAll', 'is', 'is']);

    expect(updated).toEqual(initial);
  });

  it('replaces touching occurrences', () => {
    const initial = 'aaaaa';

    const updated = update(initial, ['replaceAll', 'a', 'bB']);

    expect(updated).toEqual('bBbBbBbBbB');
  });

  it('does not replace recursively', () => {
    const initial = 'foo bar baz';

    const updated = update(initial, ['replaceAll', 'bar', 'foo bar baz']);

    expect(updated).toEqual('foo foo bar baz baz');
  });

  it('does not interpret inputs as regular expressions', () => {
    const initial = 'vowels are [aeiou]';

    const updated = update(initial, ['replaceAll', '[aeiou]', 'letters']);

    expect(updated).toEqual('vowels are letters');
  });
});

describe('rpn with enableRiskyStringOps', () => {
  it('operates on numbers and strings', () => {
    expect(() => update([], ['rpn']))
      .toThrow('/ rpn: expected target to be primitive');
  });

  it('rejects changes of type', () => {
    expect(() => update('abc', ['rpn', 7])).toThrow();
    expect(() => update(7, ['rpn', '"abc"'])).toThrow();
  });

  it('can return a string', () => {
    const result = update('', ['rpn', '"abc"']);
    expect(result).toEqual('abc');
  });

  it('provides the original string value as x', () => {
    const result = update('abcdefg', ['rpn', 'x', 2, -2, 'slice:3']);
    expect(result).toEqual('cde');
  });

  it('allows string operations', () => {
    const result = update(0, ['rpn', 2, 'String', 'Number']);
    expect(result).toEqual(2);
  });

  it('allows string concatenation', () => {
    const result = update(0, ['rpn', '"2"', '"3"', '+', 'Number']);
    expect(result).toEqual(23);
  });
});
