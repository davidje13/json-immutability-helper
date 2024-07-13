import listCommands from '../src/commands/list.mjs';
import context from '../src/index.mjs';
const { update } = context.with(listCommands);

const initial = [10, 9, 11, 9, -1];

describe('update', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['update', ['first', { equals: 9 }], ['=', 2]])).throws(
      '/ update: expected target to be array',
    );
  });

  it(
    'updates items which match the locator',
    ({ input, expected }) => expect(update(initial, input)).equals(expected),
    {
      parameters: [
        { input: ['update', ['first', { equals: 9 }], ['=', 2]], expected: [10, 2, 11, 9, -1] },
        { input: ['update', ['first', { equals: 1 }], ['=', 2]], expected: [10, 9, 11, 9, -1] },
        { input: ['update', ['last', { equals: 9 }], ['=', 2]], expected: [10, 9, 11, 2, -1] },
        { input: ['update', ['last', { equals: 1 }], ['=', 2]], expected: [10, 9, 11, 9, -1] },
        { input: ['update', ['all', { equals: 9 }], ['=', 2]], expected: [10, 2, 11, 2, -1] },
        { input: ['update', ['all', { equals: 1 }], ['=', 2]], expected: [10, 9, 11, 9, -1] },

        // unset
        {
          input: ['update', ['first', { equals: 9 }], ['unset']],
          expected: [10, 11, 9, -1],
        },
        {
          input: ['update', ['all', { equals: 9 }], ['unset']],
          expected: [10, 11, -1],
        },
        {
          input: ['update', ['first', { equals: 9 }], ['=', undefined]],
          expected: [10, undefined, 11, 9, -1],
        },
        {
          input: ['update', ['all', { equals: 9 }], ['=', undefined]],
          expected: [10, undefined, 11, undefined, -1],
        },

        // upsert
        {
          input: ['update', ['first', { equals: 9 }], ['=', 2], 0],
          expected: [10, 2, 11, 9, -1],
        },
        {
          input: ['update', ['first', { equals: 1 }], ['=', 2], 0],
          expected: [10, 9, 11, 9, -1, 2],
        },
        {
          input: ['update', ['last', { equals: 1 }], ['=', 2], 0],
          expected: [10, 9, 11, 9, -1, 2],
        },
      ],
    },
  );
});

describe('updateAll', () => {
  it('applies an update to all items in a list', () => {
    const updated = update(initial, ['updateAll', ['=', 2]]);
    expect(updated).equals([2, 2, 2, 2, 2]);
  });

  it('repacks the array after removing items', () => {
    const updated = update(initial, ['updateAll', ['updateIf', { equals: 9 }, ['unset']]]);
    expect(updated).equals([10, 11, -1]);
  });

  it('repacks the array after removing all items', () => {
    const updated = update(initial, ['updateAll', ['unset']]);
    expect(updated).equals([]);
  });
});

describe('updateWhere', () => {
  it('applies an update to all matching items in a list', () => {
    const updated = update(initial, ['updateWhere', { equals: 9 }, ['=', 2]]);
    expect(updated).equals([10, 2, 11, 2, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['updateWhere', { equals: 1 }, ['=', 2]]);
    expect(updated).same(initial);
  });

  it('repacks the array after removing items', () => {
    const updated = update(initial, ['updateWhere', { equals: 9 }, ['unset']]);
    expect(updated).equals([10, 11, -1]);
  });

  it('does not repack after setting items to undefined', () => {
    const updated = update(initial, ['updateWhere', { equals: 9 }, ['=', undefined]]);
    expect(updated).equals([10, undefined, 11, undefined, -1]);
  });
});

describe('updateFirstWhere', () => {
  it('applies an update to the first matching item in a list', () => {
    const updated = update(initial, ['updateFirstWhere', { equals: 9 }, ['=', 2]]);
    expect(updated).equals([10, 2, 11, 9, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['updateFirstWhere', { equals: 1 }, ['=', 2]]);
    expect(updated).same(initial);
  });

  it('repacks the array after removing items', () => {
    const updated = update(initial, ['updateFirstWhere', { equals: 9 }, ['unset']]);
    expect(updated).equals([10, 11, 9, -1]);
  });
});

describe('updateLastWhere', () => {
  it('applies an update to the last matching item in a list', () => {
    const updated = update(initial, ['updateLastWhere', { equals: 9 }, ['=', 2]]);
    expect(updated).equals([10, 9, 11, 2, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['updateLastWhere', { equals: 1 }, ['=', 2]]);
    expect(updated).same(initial);
  });

  it('repacks the array after removing items', () => {
    const updated = update(initial, ['updateLastWhere', { equals: 9 }, ['unset']]);
    expect(updated).equals([10, 9, 11, -1]);
  });
});
