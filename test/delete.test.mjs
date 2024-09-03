import listCommands from '../src/commands/list.mjs';
import context from '../src/index.mjs';
const { update } = context.with(listCommands);

const initial = [10, 9, 11, 9, -1];

describe('delete', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['delete', ['first', ['=', 9]]])).throws(
      '/ delete: expected target to be array',
    );
  });

  it('takes a locator', () => {
    expect(() => update([], ['delete'])).throws('/ delete: expected [command, multi-locator]');
  });

  it(
    'updates items which match the locator',
    ({ input, expected }) => expect(update(initial, input)).equals(expected),
    {
      parameters: [
        { input: ['delete', ['first', ['=', 9]]], expected: [10, 11, 9, -1] },
        { input: ['delete', ['first', ['=', 1]]], expected: [10, 9, 11, 9, -1] },
        { input: ['delete', ['last', ['=', 9]]], expected: [10, 9, 11, -1] },
        { input: ['delete', ['last', ['=', 1]]], expected: [10, 9, 11, 9, -1] },
        { input: ['delete', ['all', ['=', 9]]], expected: [10, 11, -1] },
        { input: ['delete', ['all', ['=', 1]]], expected: [10, 9, 11, 9, -1] },
      ],
    },
  );

  it(
    'does nothing if no items match',
    ({ input }) => expect(update(initial, input)).same(initial),
    {
      parameters: [
        { input: ['delete', ['first', ['=', 1]]] },
        { input: ['delete', ['last', ['=', 1]]] },
        { input: ['delete', ['all', ['=', 1]]] },
      ],
    },
  );
});
