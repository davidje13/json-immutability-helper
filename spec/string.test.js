const { Context, update } = require('../index');

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

describe('rpn with enableRiskyStringOps', () => {
  const context = new Context();
  context.enableRiskyStringOps();

  it('operates on numbers and strings', () => {
    expect(() => context.update([], ['rpn']))
      .toThrow('/ rpn: expected target to be primitive');
  });

  it('rejects changes of type', () => {
    expect(() => context.update('abc', ['rpn', 7])).toThrow();
    expect(() => context.update(7, ['rpn', '"abc"'])).toThrow();
  });

  it('can return a string', () => {
    const result = context.update('', ['rpn', '"abc"']);
    expect(result).toEqual('abc');
  });

  it('provides the original string value as x', () => {
    const result = context.update('abcdefg', ['rpn', 'x', 2, -2, 'slice:3']);
    expect(result).toEqual('cde');
  });

  it('allows string operations', () => {
    const result = context.update(0, ['rpn', 2, 'String', 'Number']);
    expect(result).toEqual(2);
  });

  it('allows string concatenation', () => {
    const result = context.update(0, ['rpn', '"2"', '"3"', '+', 'Number']);
    expect(result).toEqual(23);
  });
});
