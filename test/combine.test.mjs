import listCommands from '../src/commands/list.mjs';
import { context, UNSET_TOKEN } from '../src/index.mjs';
const { update } = context.with(listCommands);

const ANY_INPUT = [undefined, null, true, false, 0, 1, '', 'a', {}, [], { a: 1 }, [1], [{ a: 1 }]];

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

  it('falls back to not merging if an error occurs during flattening', () => {
    expect(
      update.combine([
        ['=', ''],
        ['+', 2],
      ]),
    ).equals(['seq', ['=', ''], ['+', 2]]);
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

  it('merges multiple update operations on a list which affect the same item', () => {
    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
      ]),
    ).equals(['update', ['first', { id: ['=', 1] }], { x: ['+', 3] }]);
  });

  it('merges updates around an insert if the insert is unrelated', () => {
    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
        ['push', { id: 2 }],
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['first', { id: ['=', 1] }], { x: ['+', 3] }],
      ['push', { id: 2 }],
    ]);

    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
        ['unshift', { id: 2 }],
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['first', { id: ['=', 1] }], { x: ['+', 3] }],
      ['unshift', { id: 2 }],
    ]);

    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
        ['insert', 'after', ['first', { id: ['=', 2] }], { id: 3 }],
        ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
      ]),
    ).equals([
      'seq',
      ['update', ['first', { id: ['=', 1] }], { x: ['+', 3] }],
      ['insert', 'after', ['first', { id: ['=', 2] }], { id: 3 }],
    ]);
  });

  it('merges delete operations on a list which affect the same item', () => {
    expect(
      update.combine([
        ['delete', ['one', { id: ['=', 1] }]],
        ['delete', ['one', { id: ['=', 1] }]],
      ]),
    ).equals(['delete', ['one', { id: ['=', 1] }]]);

    expect(
      update.combine([
        ['delete', ['one', { id: ['=', 1] }]],
        ['delete', ['all', { id: ['=', 1] }]],
      ]),
    ).equals(['delete', ['all', { id: ['=', 1] }]]);

    expect(
      update.combine([
        ['delete', ['first', { id: ['=', 1] }]],
        ['delete', ['all', { id: ['=', 1] }]],
      ]),
    ).equals(['delete', ['all', { id: ['=', 1] }]]);
  });

  it('removes update operations which are clobbered by a delete', () => {
    expect(
      update.combine([
        ['update', ['one', { id: ['=', 1] }], { x: ['=', 1] }],
        ['delete', ['one', { id: ['=', 1] }]],
      ]),
    ).equals(['delete', ['one', { id: ['=', 1] }]]);

    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { x: ['=', 1] }],
        ['delete', ['first', { id: ['=', 1] }]],
      ]),
    ).equals(['delete', ['first', { id: ['=', 1] }]]);

    expect(
      update.combine([
        ['update', ['first', { id: ['=', 1] }], { x: ['=', 1] }],
        ['delete', ['all', { id: ['=', 1] }]],
      ]),
    ).equals(['delete', ['all', { id: ['=', 1] }]]);
  });

  it('removes insert operations which are clobbered by a delete', () => {
    expect(
      update.combine([
        ['push', { id: 1 }],
        ['delete', ['one', { id: ['=', 1] }]],
      ]),
    ).equals({});

    expect(
      update.combine([
        ['push', { id: 1 }, { id: 2 }, { id: 3 }],
        ['delete', ['one', { id: ['=', 2] }]],
      ]),
    ).equals(['push', { id: 1 }, { id: 3 }]);

    expect(
      update.combine([
        ['push', { id: 1 }, { id: 1 }],
        ['delete', ['all', { id: ['=', 1] }]],
      ]),
    ).equals(['delete', ['all', { id: ['=', 1] }]]);

    expect(
      update.combine([
        ['push', { id: 1 }, { id: 2 }],
        ['delete', ['one', { id: ['=', 1] }]],
        ['delete', ['one', { id: ['=', 2] }]],
      ]),
    ).equals({});
  });

  it('stops merging if a delete is fully satisfied', () => {
    expect(
      update.combine([
        ['delete', ['one', { id: ['=', 1] }]],
        ['push', { id: 1 }],
        ['delete', ['one', { id: ['=', 1] }]],
      ]),
    ).equals(['delete', ['one', { id: ['=', 1] }]]);
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

  it(
    'does not change the behaviour of any valid updates',
    ({ inputs = ANY_INPUT, specs }) => {
      for (const input of inputs) {
        let expected = input;
        for (let i = 0; i < specs.length; ++i) {
          expected = update(expected, specs[i]);
          const combinedSpec = update.combine(specs.slice(0, i + 1));
          expect(update(input, combinedSpec)).equals(expected);
        }
      }
    },
    {
      parameters: [
        {
          specs: [
            ['=', 2],
            ['=', 3],
          ],
        },
        {
          specs: [
            ['=', 2],
            ['+', 1],
          ],
        },
        {
          inputs: [undefined, 1],
          specs: [
            ['init', 2],
            ['+', 1],
          ],
        },
        {
          inputs: [{ a: 1 }],
          specs: [{ b: ['=', 2] }, { c: ['=', 3] }],
        },
        {
          inputs: [10],
          specs: [
            ['+', 1],
            ['+', 2],
          ],
        },
        {
          inputs: [10],
          specs: [
            ['+', 1],
            ['-', 1],
          ],
        },
        {
          inputs: [true, false],
          specs: [['~'], ['~']],
        },
        {
          inputs: [{ foo: { bar: { baz: 1 } } }],
          specs: [{ foo: { bar: { baz: ['=', 3] } } }, { foo: ['=', 4] }],
        },
        { specs: [['unset'], ['init', 2]] },
        {
          specs: [
            ['=', UNSET_TOKEN],
            ['init', 2],
          ],
        },
        {
          specs: [
            ['init', UNSET_TOKEN],
            ['init', 2],
          ],
        },
        {
          specs: [
            ['=', 1],
            ['init', 2],
          ],
        },
        {
          specs: [
            ['if', ['exists'], ['=', 1]],
            ['init', 2],
          ],
        },
        {
          inputs: [undefined, null, {}],
          specs: [
            ['merge', {}, {}],
            ['init', 2],
          ],
        },
        {
          inputs: [undefined, null, { a: 1 }],
          specs: [
            ['merge', {}, { a: 1 }],
            ['merge', { b: 1 }],
            ['merge', { c: 1 }],
          ],
        },
        {
          inputs: [
            [],
            [{ id: 1, x: 0 }],
            [
              { id: 1, x: 0 },
              { id: 1, x: 0 },
            ],
          ],
          specs: [
            ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
            ['update', ['last', { id: ['=', 1] }], { x: ['+', 2] }],
          ],
        },
        {
          inputs: [
            [],
            [{ id: 1, x: 0 }],
            [
              { id: 1, x: 0 },
              { id: 1, x: 0 },
            ],
            [
              { id: 2, x: 0 },
              { id: 1, x: 0 },
            ],
          ],
          specs: [
            ['update', ['first', { id: ['=', 1] }], { id: ['=', 2] }],
            ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
            ['update', ['first', { id: ['=', 2] }], { x: ['+', 2] }],
          ],
        },
        {
          inputs: [
            [],
            [{ id: 1, x: 0 }],
            [
              { id: 1, x: 0, a: 1 },
              { id: 2, x: 0, a: 2 },
            ],
            [
              { id: 1, x: 0, a: 1 },
              { id: 1, x: 0, a: 2 },
            ],
          ],
          specs: [
            ['update', ['first', { id: ['=', 1] }], { x: ['+', 1] }],
            ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
            ['update', ['first', { id: ['=', 1] }], { x: ['+', 2] }],
          ],
        },
        {
          inputs: [
            [],
            [{ id: 1, a: 0 }],
            [
              { id: 1, a: 0 },
              { id: 2, a: 2 },
            ],
            [
              { id: 1, a: 0 },
              { id: 2, a: 1 },
              { id: 3, a: 2 },
            ],
            [
              { id: 2, a: 1 },
              { id: 3, a: 2 },
              { id: 1, a: 0 },
            ],
          ],
          specs: [
            ['update', ['all', { id: ['=', 1] }], { a: ['+', 1] }],
            ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
            ['update', ['all', { id: ['=', 1] }], { a: ['+', 2] }],
          ],
        },
        {
          inputs: [
            [],
            [{ id: 1, a: 0, b: 0 }],
            [
              { id: 1, a: 0, b: 0 },
              { id: 2, a: 2, b: 0 },
            ],
            [
              { id: 1, a: 0, b: 0 },
              { id: 2, a: 1, b: 0 },
              { id: 3, a: 2, b: 0 },
            ],
            [
              { id: 2, a: 1, b: 0 },
              { id: 3, a: 2, b: 0 },
              { id: 1, a: 0, b: 0 },
            ],
          ],
          specs: [
            ['update', ['all', { id: ['=', 1] }], { b: ['+', 1] }],
            ['swap', ['first', { a: ['=', 1] }], ['first', { a: ['=', 2] }]],
            ['update', ['all', { id: ['=', 1] }], { a: ['+', 2] }],
          ],
        },
        {
          inputs: [[], [{ id: 1 }], [{ id: 1 }, { id: 1 }], [{ id: 1 }, { id: 2 }]],
          specs: [
            ['delete', ['first', { id: ['=', 1] }]],
            ['delete', ['first', { id: ['=', 1] }]],
          ],
        },
        {
          inputs: [[], [{ id: 1 }, { id: 2 }, { id: 1 }]],
          specs: [
            ['delete', ['first', { id: ['=', 1] }]],
            ['delete', ['first', { id: ['=', 2] }]],
          ],
        },
        {
          inputs: [[], [{ id: 1 }], [{ id: 1 }, { id: 1 }]],
          specs: [
            ['delete', ['first', { id: ['=', 1] }]],
            ['delete', ['one', { id: ['=', 1] }]],
          ],
        },
        {
          inputs: [
            [],
            [
              { id: 1, x: 1 },
              { id: 2, x: 1 },
              { id: 1, x: 1 },
            ],
          ],
          specs: [
            ['delete', ['first', { id: ['=', 1] }]],
            ['delete', ['first', { x: ['=', 1] }]],
          ],
        },
        {
          inputs: [
            [],
            [{ id: 1, x: 1 }],
            [
              { id: 1, x: 1 },
              { id: 2, x: 2 },
            ],
            [
              { id: 2, x: 2 },
              { id: 1, x: 1 },
            ],
          ],
          specs: [
            ['update', ['first', { id: ['=', 1] }], { x: ['=', 2] }],
            ['update', ['first', { x: ['=', 2] }], { x: ['=', 3] }],
            ['delete', ['first', { id: ['=', 1] }]],
          ],
        },
        ...['first', 'last', 'all'].flatMap((ord) =>
          [
            ['push', { id: 1, x: 0 }],
            ['unshift', { id: 1, x: 0 }],
            ['splice', [0, 0, { id: 1, x: 0 }]],
            ['splice', [10, 0, { id: 1, x: 0 }]],
            ['splice', [0, 1, { id: 1, x: 0 }]],
            ['insert', 'before', ['first', { x: ['=', 1] }], { id: 1, x: 0 }],
            ['insert', 'before', ['last', { x: ['=', 1] }], { id: 1, x: 0 }],
            ['insert', 'after', ['first', { x: ['=', 1] }], { id: 1, x: 0 }],
            ['insert', 'after', ['last', { x: ['=', 1] }], { id: 1, x: 0 }],
            ['insert', 'before', ['first', { x: ['=', 0] }], { id: 1, x: 0 }],
            ['insert', 'before', ['first', { id: ['=', 1] }], { id: 1, x: 0 }],
            ['insert', 'before', ['first', { id: ['=', 2] }], { id: 1, x: 0 }],
            ['insert', 'before', ['first', { id: ['=', 2] }], { id: 3, x: 0 }],
          ].map((op) => ({
            inputs: [[], [{ id: 1, x: 0 }], [{ id: 1, x: 1 }]],
            specs: [
              ['update', [ord, { id: ['=', 1] }], { x: ['+', 1] }],
              op,
              ['update', [ord, { id: ['=', 1] }], { x: ['+', 2] }],
            ],
          })),
        ),
        ...['first', 'last', 'all'].flatMap((ord) =>
          [
            ['push', { id: 1, x: 0 }],
            ['unshift', { id: 1, x: 0 }],
            ['insert', 'before', ['first', { id: ['=', 1] }], { id: 1, x: 0 }],
            ['insert', 'after', ['last', { id: ['=', 1] }], { id: 1, x: 0 }],
          ].map((op) => ({
            inputs: [[], [{ id: 1, x: 1 }]],
            specs: [op, ['delete', [ord, { id: ['=', 1] }]]],
          })),
        ),
        {
          inputs: [[], [{ id: 1 }]],
          specs: [
            ['delete', ['one', { id: ['=', 1] }]],
            ['push', { id: 1 }],
            ['delete', ['one', { id: ['=', 1] }]],
          ],
        },
        {
          inputs: [[], [{ id: 1 }], [{ id: 2 }]],
          specs: [
            ['insert', 'after', ['all', { id: ['=', 1] }], { id: 2 }],
            ['delete', ['one', { id: ['=', 2] }]],
          ],
        },
        {
          inputs: [[], [{ id: 1 }]],
          specs: [
            ['insert', 'after', ['first', { id: ['=', 1] }], { id: 1 }],
            ['delete', ['all', { id: ['=', 1] }]],
          ],
        },
        {
          inputs: [[], [{ id: 1 }]],
          specs: [
            ['insert', 'after', ['first', { id: ['=', 1] }], { id: 1, x: 2 }],
            ['delete', ['first', { id: ['=', 1] }]],
          ],
        },
        {
          inputs: [[]],
          specs: [
            ['push', { id: 1 }],
            ['insert', 'before', ['first', { id: ['=', 1] }], { id: 2 }],
            ['delete', ['first', { id: ['=', 1] }]],
          ],
        },
        {
          inputs: [[]],
          specs: [
            ['push', { id: 1 }],
            ['insert', 'before', ['first', { id: ['=', 1] }], { id: 2 }],
            ['delete', ['all', { id: ['=', 1] }]],
          ],
        },
        {
          inputs: [[]],
          specs: [
            ['push', { id: 1, x: 1 }, { id: 1, x: 2 }],
            ['delete', ['first', { id: ['=', 1] }]],
          ],
        },
        {
          inputs: [[]],
          specs: [
            ['push', { id: 1, x: 1 }, { id: 1, x: 2 }],
            ['update', ['first', { id: ['=', 1] }], { x: ['=', 3] }],
            ['swap', ['first', { id: ['=', 1] }], ['last', { id: ['=', 1] }]],
            ['delete', ['first', { id: ['=', 1] }]],
          ],
        },

        {
          inputs: [[]],
          specs: [
            ['push', { id: 1, x: 1 }, { id: 2, x: 2 }],
            ['update', ['one', { id: ['=', 1] }], { x: ['=', 1.1] }],
            ['update', ['one', { id: ['=', 1] }], { x: ['=', 1.2] }],
            ['update', ['one', { id: ['=', 2] }], { x: ['=', 2.1] }],
            ['update', ['one', { id: ['=', 1] }], { x: ['=', 1.3] }],
            ['delete', ['one', { id: ['=', 1] }]],
            ['push', { id: 3, x: 3 }],
            ['update', ['one', { id: ['=', 1] }], { x: ['=', 1.4] }],
            ['update', ['one', { id: ['=', 2] }], { x: ['=', 2.2] }],
            ['delete', ['one', { id: ['=', 2] }]],
            ['update', ['one', { id: ['=', 3] }], { x: ['=', 3.1] }],
            ['delete', ['one', { id: ['=', 3] }]],
          ],
        },
      ],
    },
  );
});
