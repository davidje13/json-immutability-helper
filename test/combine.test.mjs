import listCommands from '../src/commands/list.mjs';
import { context, UNSET_TOKEN } from '../src/index.mjs';
const { update } = context.with(listCommands);

describe('combine', () => {
  it('merges multiple non-conflicting specs', () => {
    const spec = update.combine([{ foo: ['=', 1] }, { bar: ['=', 2] }, { baz: ['=', 3] }]);

    expect(spec).equals({
      foo: ['=', 1],
      bar: ['=', 2],
      baz: ['=', 3],
    });
  });

  it('merges multiple conflicting specs using seq', () => {
    const spec = update.combine([{ foo: ['op1', 1] }, { foo: ['op2', 2] }]);

    expect(spec).equals({ foo: ['seq', ['op1', 1], ['op2', 2]] });
  });

  it('merges recursively', () => {
    const spec = update.combine([{ foo: { bar: { baz: ['=', 3] } } }, { foo: { zig: ['=', 4] } }]);

    expect(spec).equals({
      foo: {
        bar: { baz: ['=', 3] },
        zig: ['=', 4],
      },
    });
  });

  it('merges at multiple levels', () => {
    const spec = update.combine([{ foo: { bar: { baz: ['=', 3] } } }, { foo: ['op', 4] }]);

    expect(spec).equals({ foo: ['seq', { bar: { baz: ['=', 3] } }, ['op', 4]] });
  });

  it('generates non-nested sequential operations', () => {
    const spec = update.combine([
      { foo: ['op1', 1] },
      { foo: ['op2', 2] },
      { foo: ['op3', 3] },
      { foo: ['op4', 4] },
    ]);

    expect(spec).equals({ foo: ['seq', ['op1', 1], ['op2', 2], ['op3', 3], ['op4', 4]] });
  });

  it('flattens sequential operations', () => {
    const spec = update.combine([
      { foo: ['seq', ['op1', 1], ['op2', 2]] },
      { foo: ['seq', ['op3', 3], ['op4', 4]] },
    ]);

    expect(spec).equals({ foo: ['seq', ['op1', 1], ['op2', 2], ['op3', 3], ['op4', 4]] });
  });

  it('preserves individual actions', () => {
    expect(update.combine([['=', 2]])).equals(['=', 2]);

    expect(update.combine([{ foo: ['=', 2] }])).equals({ foo: ['=', 2] });
  });

  it('combines specs between sequences', () => {
    const spec = update.combine([['seq', ['=', {}], { foo: ['=', 1] }], { bar: ['=', 2] }]);

    expect(spec).equals(['seq', ['=', {}], { foo: ['=', 1], bar: ['=', 2] }]);
  });

  it('drops clobbered operations', () => {
    expect(
      update.combine([
        ['op1', 1],
        ['=', 2],
      ]),
    ).equals(['=', 2]);

    expect(update.combine([['op1', 1], ['unset']])).equals(['unset']);

    expect(update.combine([{ foo: { bar: { baz: ['=', 3] } } }, { foo: ['=', 4] }])).equals({
      foo: ['=', 4],
    });
  });

  it('drops unnecessary init operations', () => {
    expect(
      update.combine([
        ['=', 1],
        ['init', 2],
      ]),
    ).equals(['=', 1]);

    expect(
      update.combine([
        ['seq', ['op', 1], ['=', 2], ['op', 3]],
        ['init', 2],
      ]),
    ).equals(['seq', ['op', 1], ['=', 2], ['op', 3]]);

    expect(
      update.combine([
        ['init', 1],
        ['init', 2],
      ]),
    ).equals(['init', 1]);

    expect(
      update.combine([
        ['init', 1],
        ['seq', ['init', 2], ['op', 3]],
      ]),
    ).equals(['seq', ['init', 1], ['op', 3]]);

    expect(
      update.combine([
        ['merge', {}, {}],
        ['init', 1],
      ]),
    ).equals(['merge', {}, {}]);
  });

  it('preserves necessary init operations', () => {
    expect(
      update.combine([
        ['op', 1],
        ['init', 2],
      ]),
    ).equals(['seq', ['op', 1], ['init', 2]]);

    expect(
      update.combine([
        ['merge', {}],
        ['init', 2],
      ]),
    ).equals(['seq', ['merge', {}], ['init', 2]]);
  });

  it('flattens operations after =', () => {
    expect(
      update.combine([
        ['=', 1],
        ['+', 2],
      ]),
    ).equals(['=', 3]);

    expect(
      update.combine([
        ['=', UNSET_TOKEN],
        ['init', 2],
      ]),
    ).equals(['=', 2]);
  });

  it('flattens operations after unset', () => {
    expect(update.combine([['unset'], ['init', 2]])).equals(['=', 2]);

    expect(
      update.combine([
        ['seq', ['=', 1], ['unset']],
        ['init', 2],
      ]),
    ).equals(['=', 2]);
  });

  it('combines boolean operations', () => {
    expect(update.combine([['~'], ['~']])).equals({});
  });

  it('combines numeric operations', () => {
    expect(
      update.combine([
        ['+', 1],
        ['+', 2],
      ]),
    ).equals(['+', 3]);

    expect(
      update.combine([
        ['+', 3],
        ['-', 1],
      ]),
    ).equals(['+', 2]);

    expect(
      update.combine([
        ['-', 3],
        ['-', 1],
      ]),
    ).equals(['-', 4]);

    expect(
      update.combine([
        ['-', 3],
        ['+', 1],
      ]),
    ).equals(['-', 2]);

    expect(
      update.combine([
        ['+', 1],
        ['-', 1],
      ]),
    ).equals({});
  });

  it('combines merge operations', () => {
    expect(
      update.combine([
        ['merge', { a: 1, b: 2 }],
        ['merge', { b: 3, c: 4 }],
      ]),
    ).equals(['merge', { a: 1, b: 3, c: 4 }]);

    expect(
      update.combine([
        ['merge', { a: 1, b: 2 }, { init: 1 }],
        ['merge', { b: 3, c: 4 }, { init: 2 }],
      ]),
    ).equals(['merge', { a: 1, b: 3, c: 4 }, { init: 1 }]);
  });

  it('combines simple list operations', () => {
    expect(
      update.combine([
        ['push', 1, 2],
        ['push', 3, 4],
      ]),
    ).equals(['push', 1, 2, 3, 4]);

    expect(
      update.combine([
        ['unshift', 1, 2],
        ['unshift', 3, 4],
      ]),
    ).equals(['unshift', 3, 4, 1, 2]);

    expect(
      update.combine([
        ['addUnique', 1, 2],
        ['addUnique', 2, 3],
      ]),
    ).equals(['addUnique', 1, 2, 3]);
  });

  it('combines splice operations', () => {
    const spec = update.combine([
      ['splice', [1, 1, 'A']],
      ['splice', [-2, 0, 'B']],
    ]);

    expect(spec).equals(['splice', [1, 1, 'A'], [-2, 0, 'B']]);
  });

  it('optimises combined splice operations', () => {
    const spec = update.combine([
      ['splice', [1, 1, 'A', 'B']],
      ['splice', [2, 1, 'C']],
    ]);

    expect(spec).equals(['splice', [1, 1, 'A', 'C']]);
  });

  it('generates empty specs if given no meaningful input', () => {
    expect(update.combine([])).equals({});

    expect(update.combine([{}, {}])).equals({});
  });

  it('ignores empty input specs', () => {
    expect(update.combine([{}, ['op1', 1]])).equals(['op1', 1]);
    expect(update.combine([['op1', 1], {}])).equals(['op1', 1]);
  });

  it('optimises specs which cancel out', () => {
    expect(update.combine([{ x: { y: ['~'] } }, { x: { y: ['~'] } }])).equals({});
    expect(update.combine([{ x: { y: ['+', 1] } }, { x: { y: ['-', 1] } }])).equals({});
  });

  it('merges multiple operations on a list which affect the same item', () => {
    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
      ]),
    ).equals(['update', ['first', { id: ['=', 1] }], { x: ['+', 3] }]);
  });

  it('does not merge when using complex locators', () => {
    expect(
      update.combine([
        ['update', ['first', { id: ['>', 1] }], { x: ['+', 1] }],
        ['update', ['first', { id: ['>', 1] }], { x: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['first', { id: ['>', 1] }], { x: ['+', 1] }],
      ['update', ['first', { id: ['>', 1] }], { x: ['+', 2] }],
    ]);
  });

  it('merges interleaved updates', () => {
    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
        ['update', ['first', { id: ['=', 2] }], { x: ['+', 2] }],
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 3] }],
        ['update', ['first', { id: ['=', 2] }], { x: ['+', 4] }],
      ]),
    ).equals([
      'seq',
      ['update', ['first', { id: ['=', 1] }], { x: ['+', 4] }],
      ['update', ['first', { id: ['=', 2] }], { x: ['+', 6] }],
    ]);
  });

  it('does not merge updates which may not apply to the same items', () => {
    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
        ['update', ['last', { id: ['=', 1] }], { x: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
      ['update', ['last', { id: ['=', 1] }], { x: ['+', 2] }],
    ]);
  });

  it('does not merge updates which change the search key', () => {
    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { id: ['=', 2] }],
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['first', { id: ['=', 1] }], { id: ['=', 2] }],
      ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
    ]);
  });

  it('merges updates which preserve the search key', () => {
    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { id: ['=', 1] }],
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
      ]),
    ).equals(['update', ['first', { id: ['=', 1] }], { id: ['=', 1], x: ['+', 2] }]);
  });

  it('merges distinct operations which mix lookup types', () => {
    expect(
      update.combine([
        ['update', ['all', { id: ['=', 1] }], { x: ['+', 1] }],
        ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
        ['update', ['all', { id: ['=', 1] }], { x: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['all', { id: ['=', 1] }], { x: ['+', 3] }],
      ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
    ]);

    expect(
      update.combine([
        ['update', ['all', { id: ['=', 1] }], { a: ['+', 1] }],
        ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
        ['update', ['all', { id: ['=', 1] }], { b: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['all', { id: ['=', 1] }], { a: ['+', 1], b: ['+', 2] }],
      ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
    ]);
  });

  it('does not merge ordered locators across reorderings', () => {
    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
        ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
      ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
      ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
    ]);
  });

  it('does not merge updates which change properties used elsewhere', () => {
    expect(
      update.combine([
        ['update', ['all', { id: ['=', 1] }], { a: ['+', 1] }],
        ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
        ['update', ['all', { id: ['=', 1] }], { a: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['all', { id: ['=', 1] }], { a: ['+', 1] }],
      ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
      ['update', ['all', { id: ['=', 1] }], { a: ['+', 2] }],
    ]);

    expect(
      update.combine([
        ['update', ['all', { id: ['=', 1] }], { b: ['+', 1] }],
        ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
        ['update', ['all', { id: ['=', 1] }], { a: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['all', { id: ['=', 1] }], { b: ['+', 1] }],
      ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
      ['update', ['all', { id: ['=', 1] }], { a: ['+', 2] }],
    ]);
  });
});
