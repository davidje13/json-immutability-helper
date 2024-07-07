const {
  renderHook,
  act,
  useReducer,
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
} = require('./hooks-test-harness');
const context = require('../index');
const { makeHooks } = require('../helpers/hooks');

const allHooks = { useReducer, useState, useMemo, useRef, useLayoutEffect };

describe('makeHooks', () => {
  describe('useJSONReducer', () => {
    it('returns a state and a stable dispatch function which changes the state', () => {
      const { useJSONReducer } = makeHooks(context, { useState });
      const h = renderHook(useJSONReducer, { foo: 7 });

      expect(h.current.state).equals({ foo: 7 });
      const snapshot1 = h.current;
      const { state: state1, dispatch: dispatch1 } = snapshot1;

      act(() => h.current.dispatch({ foo: ['=', 8] }));
      expect(h.current.state).equals({ foo: 8 });

      expect(h.current).not(same(snapshot1));
      expect(h.current.state).not(same(state1));
      expect(h.current.dispatch).same(dispatch1);
      const snapshot2 = h.current;

      act(() => h.current.dispatch({ foo: ['=', 8] })); // no change
      expect(h.current.state).same(snapshot2.state);
      expect(h.current).not(same(snapshot2)); // we did not provide useMemo
    });

    it('uses useReducer directly if provided', () => {
      const { useJSONReducer } = makeHooks(context, { useReducer });
      const h = renderHook(useJSONReducer, { foo: 7 });

      expect(h.current.state).equals({ foo: 7 });

      act(() => h.current.dispatch({ foo: ['=', 8] }));
      expect(h.current.state).equals({ foo: 8 });
    });

    it('memoises the returned structure if useMemo is provided', () => {
      const { useJSONReducer } = makeHooks(context, { useState, useMemo });
      const h = renderHook(useJSONReducer, { foo: 7 });

      const snapshot1 = h.current;

      act(() => h.current.dispatch({ foo: ['=', 8] }));
      const snapshot2 = h.current;
      expect(snapshot2).not(same(snapshot1));

      act(() => h.current.dispatch({ foo: ['=', 8] })); // no change
      expect(h.current).same(snapshot2);
    });
  });

  describe('useWrappedJSONReducer', () => {
    it('delegates to a provided storage mechanism', () => {
      const { useWrappedJSONReducer } = makeHooks(context, allHooks);

      const captured = [];
      const h = renderHook(() => {
        const [state, setState] = useState({ foo: 7 });
        const setter = (v) => {
          captured.push(v);
          setState(v);
        };
        return useWrappedJSONReducer([state, setter]);
      });

      expect(captured).toHaveLength(0);
      expect(h.current.state).equals({ foo: 7 });
      const snapshot1 = h.current;

      act(() => h.current.dispatch({ foo: ['=', 8] }));
      expect(captured).toHaveLength(1);
      expect(h.current.state).equals({ foo: 8 });

      expect(h.current).not(same(snapshot1));
      expect(h.current.state).not(same(snapshot1.state));
      expect(h.current.dispatch).same(snapshot1.dispatch);
      const snapshot2 = h.current;

      act(() => h.current.dispatch({ foo: ['=', 8] })); // no change
      expect(captured).toHaveLength(2);
      expect(h.current.state).same(snapshot2.state);
    });
  });

  describe('useScopedReducer', () => {
    it('returns a reducer for a sub-section of the larger state', () => {
      const { useJSONReducer, useScopedReducer } = makeHooks(context, allHooks);
      const h = renderHook(() => {
        const full = useJSONReducer({ foo: { bar: 1 } });
        const scoped = useScopedReducer(full, ['foo']);
        return { full, scoped };
      });

      expect(h.current.full.state).equals({ foo: { bar: 1 } });
      expect(h.current.scoped.state).equals({ bar: 1 });
      const scopedDispatch1 = h.current.scoped.dispatch;

      act(() => h.current.scoped.dispatch({ bar: ['=', 2] }));
      expect(h.current.full.state).equals({ foo: { bar: 2 } });
      expect(h.current.scoped.state).equals({ bar: 2 });
      const scopedDispatch2 = h.current.scoped.dispatch;

      act(() => h.current.full.dispatch({ foo: { bar: ['=', 3] } }));
      expect(h.current.full.state).equals({ foo: { bar: 3 } });
      expect(h.current.scoped.state).equals({ bar: 3 });
      const scopedDispatch3 = h.current.scoped.dispatch;

      expect(scopedDispatch1).same(scopedDispatch2);
      expect(scopedDispatch2).same(scopedDispatch3);
    });
  });
});
