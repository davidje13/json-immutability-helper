const listCommands = require('../commands/list');
const { update } = require('../index').with(listCommands);

const initial = [10, 9, 11, 9, -1];

describe('delete', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['delete', ['first', { equals: 9 }]])).throws(
      '/ delete: expected target to be array',
    );
  });

  it(
    'updates items which match the locator',
    ({ input, expected }) => expect(update(initial, input)).equals(expected),
    {
      parameters: [
        { input: ['delete', ['first', { equals: 9 }]], expected: [10, 11, 9, -1] },
        { input: ['delete', ['first', { equals: 1 }]], expected: [10, 9, 11, 9, -1] },
        { input: ['delete', ['last', { equals: 9 }]], expected: [10, 9, 11, -1] },
        { input: ['delete', ['last', { equals: 1 }]], expected: [10, 9, 11, 9, -1] },
        { input: ['delete', ['all', { equals: 9 }]], expected: [10, 11, -1] },
        { input: ['delete', ['all', { equals: 1 }]], expected: [10, 9, 11, 9, -1] },
      ],
    },
  );
});

describe('deleteWhere', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['deleteWhere', { equals: 1 }])).throws(
      '/ deleteWhere: expected target to be array',
    );
  });

  it('takes a condition', () => {
    expect(() => update([], ['deleteWhere'])).throws(
      '/ deleteWhere: expected [command, condition]',
    );
  });

  it('deletes all matching items in a list', () => {
    const updated = update(initial, ['deleteWhere', { equals: 9 }]);

    expect(updated).equals([10, 11, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['deleteWhere', { equals: 1 }]);

    expect(updated).same(initial);
  });
});

describe('deleteFirstWhere', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['deleteFirstWhere', { equals: 1 }])).throws(
      '/ deleteFirstWhere: expected target to be array',
    );
  });

  it('takes a condition', () => {
    expect(() => update([], ['deleteFirstWhere'])).throws(
      '/ deleteFirstWhere: expected [command, condition]',
    );
  });

  it('deletes the first matching item in a list', () => {
    const updated = update(initial, ['deleteFirstWhere', { equals: 9 }]);

    expect(updated).equals([10, 11, 9, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['deleteFirstWhere', { equals: 1 }]);

    expect(updated).same(initial);
  });
});

describe('deleteLastWhere', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['deleteLastWhere', { equals: 1 }])).throws(
      '/ deleteLastWhere: expected target to be array',
    );
  });

  it('takes a condition', () => {
    expect(() => update([], ['deleteLastWhere'])).throws(
      '/ deleteLastWhere: expected [command, condition]',
    );
  });

  it('deletes the last matching item in a list', () => {
    const updated = update(initial, ['deleteLastWhere', { equals: 9 }]);

    expect(updated).equals([10, 9, 11, -1]);
  });

  it('does nothing if no items match', () => {
    const updated = update(initial, ['deleteLastWhere', { equals: 1 }]);

    expect(updated).same(initial);
  });
});
