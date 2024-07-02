const context = require('../index');
const { makeHooks } = require('../helpers/hooks');

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
  });
});

let CURRENT;
let ACT_CHANGED;
function renderHook(hook, ...args) {
  const state = [];

  let latestArgs;
  const onChange = () => ACT_CHANGED(rerender);
  let first = true;

  const rerender = () => {
    CURRENT = { state, pos: 0, first, onChange };
    r.current = hook(...latestArgs);
    CURRENT = null;
    first = false;
  };

  const r = {
    current: null,
    rerender: (...args) => {
      latestArgs = args;
      act(rerender);
    },
  };
  r.rerender(...args);
  return r;
}

function act(fn) {
  const changes = new Set();
  ACT_CHANGED = (f) => changes.add(f);
  fn();
  for (let n = 0; changes.size > 0; ) {
    if (++n > 1000) {
      throw new Error('infinite loop');
    }
    const v = changes.values().next().value;
    changes.delete(v);
    v();
  }
  ACT_CHANGED = null;
}

function getInternalState(init) {
  if (CURRENT.first) {
    const s = init(CURRENT.onChange);
    CURRENT.state.push(s);
    return s;
  }
  return CURRENT.state[CURRENT.pos++];
}

function useState(initial) {
  const s = getInternalState((onChange) => {
    const state = {
      current: typeof initial === 'function' ? initial() : initial,
      setter: (v) => {
        state.current = typeof v === 'function' ? v(state.current) : v;
        onChange();
      },
    };
    return state;
  });
  return [s.current, s.setter];
}
