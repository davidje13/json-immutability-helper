import listCommands from '../src/commands/list.mjs';
import context from '../src/index.mjs';
const { update } = context.with(listCommands);

const initial = [10, 9, 11, 9, -1];

describe('insert', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['insert', 'before', ['first', ['=', 9]], 'value'])).throws(
      '/ insert: expected target to be array',
    );
  });

  it('rejects invalid locations', () => {
    expect(() => update(initial, ['insert', 'foo', ['first', ['=', 9]], 'value'])).throws(
      '/ insert: expected [command, enum[before,after], multi-locator, value...]',
    );
  });

  it(
    'inserts items in the requested location',
    ({ input, expected }) => expect(update(initial, input)).equals(expected),
    {
      parameters: [
        {
          input: ['insert', 'before', ['first', ['=', 9]], 'item-1', 'item-2'],
          expected: [10, 'item-1', 'item-2', 9, 11, 9, -1],
        },
        {
          input: ['insert', 'before', ['first', ['=', 1]], 'item-1', 'item-2'],
          expected: [10, 9, 11, 9, -1, 'item-1', 'item-2'],
        },
        {
          input: ['insert', 'after', ['first', ['=', 9]], 'item-1', 'item-2'],
          expected: [10, 9, 'item-1', 'item-2', 11, 9, -1],
        },
        {
          input: ['insert', 'after', ['first', ['=', 1]], 'item-1', 'item-2'],
          expected: [10, 9, 11, 9, -1, 'item-1', 'item-2'],
        },
        {
          input: ['insert', 'before', ['last', ['=', 9]], 'item-1', 'item-2'],
          expected: [10, 9, 11, 'item-1', 'item-2', 9, -1],
        },
        {
          input: ['insert', 'before', ['last', ['=', 1]], 'item-1', 'item-2'],
          expected: ['item-1', 'item-2', 10, 9, 11, 9, -1],
        },
        {
          input: ['insert', 'after', ['last', ['=', 9]], 'item-1', 'item-2'],
          expected: [10, 9, 11, 9, 'item-1', 'item-2', -1],
        },
        {
          input: ['insert', 'after', ['last', ['=', 1]], 'item-1', 'item-2'],
          expected: ['item-1', 'item-2', 10, 9, 11, 9, -1],
        },
        {
          input: ['insert', 'before', ['all', ['=', 9]], 'item-1', 'item-2'],
          expected: [10, 'item-1', 'item-2', 9, 11, 'item-1', 'item-2', 9, -1],
        },
        {
          input: ['insert', 'before', ['all', ['=', 1]], 'item-1', 'item-2'],
          expected: [10, 9, 11, 9, -1],
        },
        {
          input: ['insert', 'after', ['all', ['=', 9]], 'item-1', 'item-2'],
          expected: [10, 9, 'item-1', 'item-2', 11, 9, 'item-1', 'item-2', -1],
        },
        {
          input: ['insert', 'after', ['all', ['=', 1]], 'item-1', 'item-2'],
          expected: [10, 9, 11, 9, -1],
        },
        {
          input: ['insert', 'after', ['all', ['>', 2]], 'a'],
          expected: [10, 'a', 9, 'a', 11, 'a', 9, 'a', -1],
        },
        {
          input: ['insert', 'after', [2, ['>', 2]], 'a'],
          expected: [10, 9, 11, 'a', 9, -1],
        },
        {
          input: ['insert', 'after', [-3, ['>', 2]], 'a'],
          expected: [10, 9, 'a', 11, 9, -1],
        },
      ],
    },
  );
});
