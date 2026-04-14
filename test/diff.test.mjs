import { specFromDiff } from '../src/helpers/diff.mjs';
import listCommands from '../src/commands/list.mjs';
import context from '../src/index.mjs';
const { update } = context.with(listCommands);

describe('specFromDiff', () => {
  it(
    'returns a spec to convert between two objects',
    ({ state1, state2, expectedSpec, expectedResult = state2 }) => {
      const spec = specFromDiff(state1, state2);
      expect(spec).equals(expectedSpec);

      expect(update(state1, spec)).equals(expectedResult);
    },
    {
      parameters: [
        {
          name: 'object properties',
          state1: { foo: 1, bar: 2 },
          state2: { foo: 1, bar: 3 },
          expectedSpec: ['seq', ['init', {}], { bar: ['=', 3] }],
        },
        {
          name: 'implicitly removing properties',
          state1: { foo: 1, bar: 2 },
          state2: { bar: 3 },
          expectedSpec: ['seq', ['init', {}], { foo: ['unset'], bar: ['=', 3] }],
        },
        {
          name: 'explicitly removing properties',
          state1: { foo: 1 },
          state2: { foo: undefined },
          expectedSpec: ['seq', ['init', {}], { foo: ['unset'] }],
          expectedResult: {},
        },
        {
          name: 'sub-objects',
          state1: { foo: { a: 1, b: 2 } },
          state2: { foo: { a: 1.1 } },
          expectedSpec: [
            'seq',
            ['init', {}],
            { foo: ['seq', ['init', {}], { a: ['=', 1.1], b: ['unset'] }] },
          ],
        },
        {
          name: 'unchanged object',
          state1: { foo: { a: 1, b: 2 }, bar: 3 },
          state2: { foo: { a: 1, b: 2 }, bar: 3 },
          expectedSpec: {},
        },
      ],
    },
  );

  it('assigns primitive values', () => {
    expect(specFromDiff(1, 2)).equals(['=', 2]);
    expect(specFromDiff('a', 'b')).equals(['=', 'b']);
    expect(specFromDiff(true, false)).equals(['=', false]);
    expect(specFromDiff(true, null)).equals(['=', null]);
    expect(specFromDiff({}, null)).equals(['=', null]);
  });

  it('assigns arrays of primitives', () => {
    expect(specFromDiff([1, 2], [3, 4])).equals(['=', [3, 4]]);
    expect(specFromDiff([1, 2], [1, 2, 3])).equals(['=', [1, 2, 3]]);
    expect(specFromDiff([1, 2], [1])).equals(['=', [1]]);
  });

  it('unsets values', () => {
    expect(specFromDiff(1, undefined)).equals(['unset']);
    expect(specFromDiff('a', undefined)).equals(['unset']);
    expect(specFromDiff(true, undefined)).equals(['unset']);
    expect(specFromDiff(null, undefined)).equals(['unset']);
    expect(specFromDiff({}, undefined)).equals(['unset']);
    expect(specFromDiff([], undefined)).equals(['unset']);
  });

  it(
    'sets new values',
    ({ value, expectedSpec = ['=', value] }) => {
      const spec = specFromDiff(undefined, value);
      expect(spec).equals(expectedSpec);

      expect(update(undefined, spec)).equals(value);
    },
    {
      parameters: [
        { name: 'number', value: 1 },
        { name: 'string', value: 'a' },
        { name: 'true', value: true },
        { name: 'null', value: null },
        { name: 'empty object', value: {}, expectedSpec: ['init', {}] },
        {
          name: 'object',
          value: { foo: 'a' },
          expectedSpec: ['seq', ['init', {}], { foo: ['=', 'a'] }],
        },
        { name: 'empty array', value: [] },
        { name: 'array', value: [1, 2] },
      ],
    },
  );

  it('does not remove properties if ignoreOmittedProperties is true', () => {
    const spec = specFromDiff({ foo: 1, bar: 2 }, { bar: 3 }, { ignoreOmittedProperties: true });
    expect(spec).equals(['seq', ['init', {}], { bar: ['=', 3] }]);
  });

  it('ignores unchanged values', () => {
    expect(specFromDiff(1, 1)).equals({});
    expect(specFromDiff('a', 'a')).equals({});
    expect(specFromDiff(true, true)).equals({});
    expect(specFromDiff(null, null)).equals({});
    expect(specFromDiff({}, {})).equals({});
    expect(specFromDiff([], [])).equals({});
    expect(specFromDiff([1, 2], [1, 2])).equals({});
    expect(specFromDiff({ a: 1 }, { a: 1 })).equals({});
    expect(specFromDiff([{ a: 1 }], [{ a: 1 }])).equals({});
    expect(specFromDiff(undefined, undefined)).equals({});
  });

  it('assigns if the type changes', () => {
    expect(specFromDiff('a', 2)).equals(['=', 2]);
    expect(specFromDiff(1, 'b')).equals(['=', 'b']);
    expect(specFromDiff([{ a: 1 }], { foo: 1 })).equals(['=', { foo: 1 }]);
    expect(specFromDiff({ foo: 1 }, [{ a: 1 }])).equals(['=', [{ a: 1 }]]);
    expect(specFromDiff(null, { foo: 1 })).equals(['seq', ['init', {}], { foo: ['=', 1] }]);
    expect(specFromDiff(null, [{ a: 1 }])).equals(['=', [{ a: 1 }]]);
    expect(specFromDiff(undefined, { foo: 1 })).equals(['seq', ['init', {}], { foo: ['=', 1] }]);
    expect(specFromDiff(undefined, [{ a: 1 }])).equals(['=', [{ a: 1 }]]);
  });

  it('uses key lookups for arrays if configured', () => {
    const state1 = {
      things: [
        { id: 'a', v: 1 },
        { id: 'b', v: 2 },
      ],
    };
    const state2 = {
      things: [
        { id: 'a', v: 1.1 },
        { id: 'c', v: 3 },
      ],
    };

    const spec = specFromDiff(state1, state2, { arrayKey: 'id' });

    expect(spec).equals([
      'seq',
      ['init', {}],
      {
        things: [
          'seq',
          ['init', []],
          ['update', ['first', { id: ['=', 'a'] }], { v: ['=', 1.1] }, { id: 'a', v: 1 }],
          ['update', ['first', { id: ['=', 'c'] }], { id: ['=', 'c'], v: ['=', 3] }, {}],
          ['delete', ['first', { id: ['=', 'b'] }]],
        ],
      },
    ]);

    expect(update(state1, spec)).equals(state2);
  });

  it('ignores removed keyed array items if ignoreOmittedArrayItems is true', () => {
    const state1 = {
      things: [
        { id: 'a', v: 1 },
        { id: 'b', v: 2 },
      ],
    };
    const state2 = { things: [{ id: 'a', v: 1.1 }] };

    const spec = specFromDiff(state1, state2, { arrayKey: 'id', ignoreOmittedArrayItems: true });

    expect(spec).equals([
      'seq',
      ['init', {}],
      {
        things: [
          'seq',
          ['init', []],
          ['update', ['first', { id: ['=', 'a'] }], { v: ['=', 1.1] }, { id: 'a', v: 1 }],
        ],
      },
    ]);
  });

  it('ignores array reordering if using keys', () => {
    expect(
      specFromDiff(
        [
          { a: 1, b: 1 },
          { a: 2, b: 2 },
        ],
        [
          { a: 2, b: 2 },
          { a: 1, b: 1 },
        ],
        { arrayKey: 'a' },
      ),
    ).equals({});

    expect(
      specFromDiff(
        [
          { a: 1, b: 1 },
          { a: 2, b: 2 },
        ],
        [
          { a: 2, b: 1 },
          { a: 1, b: 2 },
        ],
        { arrayKey: 'a' },
      ),
    ).equals([
      'seq',
      ['init', []],
      ['update', ['first', { a: ['=', 2] }], { b: ['=', 1] }, { a: 2, b: 2 }],
      ['update', ['first', { a: ['=', 1] }], { b: ['=', 2] }, { a: 1, b: 1 }],
    ]);
  });
});
