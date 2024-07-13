import listCommands from '../src/commands/list.mjs';
import context from '../src/index.mjs';
const { update } = context.with(listCommands);

const initial = [10, 9, 11, 9, -1];

describe('insert', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['insert', 'before', ['first', { equals: 9 }], 'value'])).throws(
      '/ insert: expected target to be array',
    );
  });

  it('rejects invalid locations', () => {
    expect(() => update(initial, ['insert', 'foo', ['first', { equals: 9 }], 'value'])).throws(
      '/ insert: expected [command, enum[before,after], multi-locator, value...]',
    );
  });

  it(
    'inserts items in the requested location',
    ({ input, expected }) => expect(update(initial, input)).equals(expected),
    {
      parameters: [
        {
          input: ['insert', 'before', ['first', { equals: 9 }], 'item-1', 'item-2'],
          expected: [10, 'item-1', 'item-2', 9, 11, 9, -1],
        },
        {
          input: ['insert', 'before', ['first', { equals: 1 }], 'item-1', 'item-2'],
          expected: [10, 9, 11, 9, -1, 'item-1', 'item-2'],
        },
        {
          input: ['insert', 'after', ['first', { equals: 9 }], 'item-1', 'item-2'],
          expected: [10, 9, 'item-1', 'item-2', 11, 9, -1],
        },
        {
          input: ['insert', 'after', ['first', { equals: 1 }], 'item-1', 'item-2'],
          expected: [10, 9, 11, 9, -1, 'item-1', 'item-2'],
        },
        {
          input: ['insert', 'before', ['last', { equals: 9 }], 'item-1', 'item-2'],
          expected: [10, 9, 11, 'item-1', 'item-2', 9, -1],
        },
        {
          input: ['insert', 'before', ['last', { equals: 1 }], 'item-1', 'item-2'],
          expected: ['item-1', 'item-2', 10, 9, 11, 9, -1],
        },
        {
          input: ['insert', 'after', ['last', { equals: 9 }], 'item-1', 'item-2'],
          expected: [10, 9, 11, 9, 'item-1', 'item-2', -1],
        },
        {
          input: ['insert', 'after', ['last', { equals: 1 }], 'item-1', 'item-2'],
          expected: ['item-1', 'item-2', 10, 9, 11, 9, -1],
        },
        {
          input: ['insert', 'before', ['all', { equals: 9 }], 'item-1', 'item-2'],
          expected: [10, 'item-1', 'item-2', 9, 11, 'item-1', 'item-2', 9, -1],
        },
        {
          input: ['insert', 'before', ['all', { equals: 1 }], 'item-1', 'item-2'],
          expected: [10, 9, 11, 9, -1],
        },
        {
          input: ['insert', 'after', ['all', { equals: 9 }], 'item-1', 'item-2'],
          expected: [10, 9, 'item-1', 'item-2', 11, 9, 'item-1', 'item-2', -1],
        },
        {
          input: ['insert', 'after', ['all', { equals: 1 }], 'item-1', 'item-2'],
          expected: [10, 9, 11, 9, -1],
        },
        {
          input: ['insert', 'after', ['all', { greaterThan: 2 }], 'a'],
          expected: [10, 'a', 9, 'a', 11, 'a', 9, 'a', -1],
        },
        {
          input: ['insert', 'after', [2, { greaterThan: 2 }], 'a'],
          expected: [10, 9, 11, 'a', 9, -1],
        },
        {
          input: ['insert', 'after', [-3, { greaterThan: 2 }], 'a'],
          expected: [10, 9, 'a', 11, 9, -1],
        },
      ],
    },
  );
});

describe('insertBeforeFirstWhere', () => {
  it('inserts new items before the first matching item', () => {
    const updated = update(initial, ['insertBeforeFirstWhere', { equals: 9 }, 'item-1', 'item-2']);

    expect(updated).equals([10, 'item-1', 'item-2', 9, 11, 9, -1]);
  });

  it('inserts at the end if no items match', () => {
    const updated = update(initial, ['insertBeforeFirstWhere', { equals: 1 }, 'item-1', 'item-2']);

    expect(updated).equals([10, 9, 11, 9, -1, 'item-1', 'item-2']);
  });
});

describe('insertAfterFirstWhere', () => {
  it('inserts new items after the first matching item', () => {
    const updated = update(initial, ['insertAfterFirstWhere', { equals: 9 }, 'item-1', 'item-2']);

    expect(updated).equals([10, 9, 'item-1', 'item-2', 11, 9, -1]);
  });

  it('inserts at the end if no items match', () => {
    const updated = update(initial, ['insertAfterFirstWhere', { equals: 1 }, 'item-1', 'item-2']);

    expect(updated).equals([10, 9, 11, 9, -1, 'item-1', 'item-2']);
  });
});

describe('insertBeforeLastWhere', () => {
  it('inserts new items before the last matching item', () => {
    const updated = update(initial, ['insertBeforeLastWhere', { equals: 9 }, 'item-1', 'item-2']);

    expect(updated).equals([10, 9, 11, 'item-1', 'item-2', 9, -1]);
  });

  it('inserts at the start if no items match', () => {
    const updated = update(initial, ['insertBeforeLastWhere', { equals: 1 }, 'item-1', 'item-2']);

    expect(updated).equals(['item-1', 'item-2', 10, 9, 11, 9, -1]);
  });
});

describe('insertAfterLastWhere', () => {
  it('inserts new items after the last matching item', () => {
    const updated = update(initial, ['insertAfterLastWhere', { equals: 9 }, 'item-1', 'item-2']);

    expect(updated).equals([10, 9, 11, 9, 'item-1', 'item-2', -1]);
  });

  it('inserts at the start if no items match', () => {
    const updated = update(initial, ['insertAfterLastWhere', { equals: 1 }, 'item-1', 'item-2']);

    expect(updated).equals(['item-1', 'item-2', 10, 9, 11, 9, -1]);
  });
});
