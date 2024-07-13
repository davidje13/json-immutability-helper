import context from '../src/index.mjs';
import { getScopedState, makeScopedSpec, makeScopedReducer } from '../src/helpers/scoped.mjs';

describe('scoped', () => {
  describe('getScopedState', () => {
    it('extracts sub-state from the given state', () => {
      const subState = getScopedState(context, { foo: { bar: { baz: 1 } } }, ['foo', 'bar']);

      expect(subState).equals({ baz: 1 });
    });

    it('follows array indices', () => {
      const subState = getScopedState(context, [{ baz: 1 }, { baz: 2 }], [0]);

      expect(subState).equals({ baz: 1 });
    });

    it('follows array lookups', () => {
      const subState = getScopedState(
        context,
        [
          { id: 1, baz: 1 },
          { id: 2, baz: 2 },
        ],
        [['id', 2]],
      );

      expect(subState).equals({ id: 2, baz: 2 });
    });

    it('returns undefined if any object key cannot be found', () => {
      const subState = getScopedState(context, { foo: { nope: { baz: 1 } } }, [
        'foo',
        'bar',
        'baz',
      ]);

      expect(subState).isUndefined();
    });

    it('returns undefined if any array index cannot be found', () => {
      const subState = getScopedState(context, { foo: [{ baz: 1 }] }, ['foo', 1, 'baz']);

      expect(subState).isUndefined();
    });

    it('returns undefined if any array lookup matches nothing', () => {
      const subState = getScopedState(context, { foo: [{ baz: 1 }] }, ['foo', ['baz', 2], 'baz']);

      expect(subState).isUndefined();
    });

    it('returns the fallback value if given', () => {
      const subState = getScopedState(context, { foo: 1 }, ['bar'], 0);

      expect(subState).equals(0);
    });

    it('does not use the fallback value if the state is explicitly undefined', () => {
      const subState = getScopedState(context, { foo: undefined }, ['foo'], 0);

      expect(subState).isUndefined();
    });
  });

  describe('makeScopedSpec', () => {
    it('converts a simple path into a nested structure', () => {
      const spec = makeScopedSpec(['foo', 'bar', 'baz'], ['=', 1]);

      expect(spec).equals({ foo: { bar: { baz: ['=', 1] } } });
    });

    it('converts array index access', () => {
      const spec = makeScopedSpec([1], ['=', 1]);

      expect(spec).equals({ 1: ['=', 1] });
    });

    it('converts array lookups', () => {
      const spec = makeScopedSpec([['id', 10]], ['=', 1]);

      expect(spec).equals(['updateWhere', ['id', 10], ['=', 1]]);
    });

    it('initialises path elements if requested', () => {
      const spec = makeScopedSpec(['foo', 0, ['id', 10]], ['=', 1], { initialisePath: true });

      expect(spec).equals([
        'seq',
        ['init', {}],
        {
          foo: [
            'seq',
            ['init', []],
            {
              0: ['seq', ['init', []], ['updateWhere', ['id', 10], ['=', 1], { id: 10 }]],
            },
          ],
        },
      ]);
    });

    it('initialises the value if requested', () => {
      const spec = makeScopedSpec(['foo'], ['=', 1], { initialiseValue: 0, initialisePath: false });

      expect(spec).equals({ foo: ['seq', ['init', 0], ['=', 1]] });
    });
  });

  describe('makeScopedReducer', () => {
    it('creates a reducer which operates on part of the original state', () => {
      const reducer = makeBasicReducer({ foo: { bar: { baz: 1 } } });
      const subReducer = makeScopedReducer(context, reducer, ['foo', 'bar']);

      expect(subReducer.state).equals({ baz: 1 });

      subReducer.dispatch({ baz: ['=', 2] });
      expect(reducer.state).equals({ foo: { bar: { baz: 2 } } });

      // subReducer's state is not updated - it is a static copy
      expect(subReducer.state).equals({ baz: 1 });
    });

    it('uses initialiseValue for both getting and updating state', () => {
      const reducer = makeBasicReducer({});
      const subReducer = makeScopedReducer(context, reducer, ['foo'], {
        initialiseValue: { id: 1 },
        initialisePath: false,
      });

      expect(subReducer.state).equals({ id: 1 });

      subReducer.dispatch({ value: ['=', 2] });
      expect(reducer.state).equals({ foo: { id: 1, value: 2 } });
    });
  });
});

const makeBasicReducer = (initialState) => {
  const reducer = {
    state: initialState,
    dispatch: (spec) => {
      reducer.state = context.update(reducer.state, spec);
    },
  };
  return reducer;
};
