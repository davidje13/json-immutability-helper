import listCommands from '../src/commands/list.mjs';
import context from '../src/index.mjs';
const { update } = context.with(listCommands);

const initial = [10, 9, 11, 9, -1];

describe('update', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['update', ['first', ['=', 9]], ['=', 2]])).throws(
      '/ update: expected target to be array',
    );
  });

  it(
    'updates items which match the locator',
    ({ input, expected }) => expect(update(initial, input)).equals(expected),
    {
      parameters: [
        { input: ['update', ['first', ['=', 9]], ['=', 2]], expected: [10, 2, 11, 9, -1] },
        { input: ['update', ['first', ['=', 1]], ['=', 2]], expected: [10, 9, 11, 9, -1] },
        { input: ['update', 'first', ['=', 2]], expected: [2, 9, 11, 9, -1] },
        { input: ['update', ['last', ['=', 9]], ['=', 2]], expected: [10, 9, 11, 2, -1] },
        { input: ['update', ['last', ['=', 1]], ['=', 2]], expected: [10, 9, 11, 9, -1] },
        { input: ['update', 'last', ['=', 2]], expected: [10, 9, 11, 9, 2] },
        { input: ['update', ['all', ['=', 9]], ['=', 2]], expected: [10, 2, 11, 2, -1] },
        { input: ['update', ['all', ['=', 1]], ['=', 2]], expected: [10, 9, 11, 9, -1] },
        { input: ['update', 'all', ['=', 2]], expected: [2, 2, 2, 2, 2] },

        // unset
        {
          input: ['update', ['first', ['=', 9]], ['unset']],
          expected: [10, 11, 9, -1],
        },
        {
          input: ['update', ['all', ['=', 9]], ['unset']],
          expected: [10, 11, -1],
        },
        {
          input: ['update', ['first', ['=', 9]], ['=', undefined]],
          expected: [10, undefined, 11, 9, -1],
        },
        {
          input: ['update', ['all', ['=', 9]], ['=', undefined]],
          expected: [10, undefined, 11, undefined, -1],
        },
        {
          input: ['update', 'all', ['unset']],
          expected: [],
        },

        // upsert
        {
          input: ['update', ['first', ['=', 9]], ['=', 2], 0],
          expected: [10, 2, 11, 9, -1],
        },
        {
          input: ['update', ['first', ['=', 1]], ['=', 2], 0],
          expected: [10, 9, 11, 9, -1, 2],
        },
        {
          input: ['update', ['last', ['=', 1]], ['=', 2], 0],
          expected: [10, 9, 11, 9, -1, 2],
        },
      ],
    },
  );
});
