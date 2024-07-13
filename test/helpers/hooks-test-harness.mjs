let CURRENT;
let ACT_CHANGED = null;
const POST_RENDER_LAYOUT = { down: new Set(), up: new Set() };
const POST_RENDER_EFFECT = { down: new Set(), up: new Set() };

export function renderHook(hook, ...args) {
  const state = [];

  let latestArgs = args;
  const onChange = () => ACT_CHANGED(render);
  let first = true;

  const render = () => {
    CURRENT = { state, pos: 0, first, onChange };
    r.current = hook(...latestArgs);
    if (CURRENT.pos !== state.length) {
      throw new Error('hooks changed between renders');
    }
    CURRENT = null;
    first = false;
  };

  const r = {
    current: null,
    rerender(...args) {
      latestArgs = args;
      act(render);
    },
    unmount() {
      act(() => {
        for (const s of state) {
          s.unmount?.();
        }
      });
    },
  };
  act(render);
  return r;
}

export function act(fn) {
  if (ACT_CHANGED !== null) {
    throw new Error('nested act() call');
  }
  const changes = new Set();
  ACT_CHANGED = (f) => changes.add(f);
  fn();
  const steps = [
    () => {
      const v = changes.values().next().value;
      changes.delete(v);
      v();
    },
    () => {
      runEffects(POST_RENDER_LAYOUT.down, true);
      runEffects(POST_RENDER_LAYOUT.up, false);
    },
    () => {
      runEffects(POST_RENDER_EFFECT.down, true);
      runEffects(POST_RENDER_EFFECT.up, false);
    },
  ];
  for (let loopCount = 0; changes.size > 0; ++loopCount) {
    if (loopCount > 1000) {
      throw new Error('infinite loop');
    }
    for (const step of steps) {
      step();
      if (changes.size > 0) {
        break;
      }
    }
  }
  ACT_CHANGED = null;
}

function runEffects(items, reverse) {
  const fns = [...items.values()];
  items.clear();
  if (reverse) {
    fns.reverse();
  }
  for (const fn of fns) {
    fn();
  }
}

function getInternalState(init) {
  if (CURRENT.first) {
    CURRENT.state.push(init(CURRENT.onChange));
  }
  return CURRENT.state[CURRENT.pos++];
}

export const useRef = (initial) => getInternalState(() => ({ current: initial }));

export function useMemo(fn, deps) {
  const state = getInternalState(() => ({ result: undefined, deps: undefined }));
  if (depsChanged(state.deps, deps)) {
    state.deps = [...deps];
    state.result = fn();
  }
  return state.result;
}

function _useEffect(stage, fn, deps) {
  const state = getInternalState(() => {
    const state = {
      teardown: undefined,
      deps: undefined,
      next: undefined,
      up() {
        state.teardown = state.next();
        state.next = undefined;
      },
      down() {
        state.teardown?.();
        state.teardown = undefined;
      },
      unmount() {
        stage.down.add(state.down);
      },
    };
    return state;
  });
  if (depsChanged(state.deps, deps)) {
    state.deps = [...deps];
    state.next = fn;
    stage.down.add(state.down);
    stage.up.add(state.up);
  }
}

export const useLayoutEffect = (fn, deps) => _useEffect(POST_RENDER_LAYOUT, fn, deps);
export const useEffect = (fn, deps) => _useEffect(POST_RENDER_EFFECT, fn, deps);

export function useReducer(reducer, initialArg, init = (x) => x) {
  const state = getInternalState((onChange) => {
    const state = {
      current: init(initialArg),
      reducer,
      dispatch(d) {
        state.current = state.reducer(state.current, d);
        onChange();
      },
    };
    return state;
  });
  state.reducer = reducer;
  return [state.current, state.dispatch];
}

const stateInit = (i) => (typeof i === 'function' ? i() : i);
const stateReducer = (s, d) => (typeof d === 'function' ? d(s) : d);
export const useState = (initial) => useReducer(stateReducer, initial, stateInit);

function depsChanged(a, b) {
  if (!b || !Array.isArray(b)) {
    throw new Error('missing deps');
  }
  if (!a) {
    return true;
  }
  if (a.length !== b.length) {
    throw new Error('deps changed');
  }
  return a.some((v, i) => b[i] !== v);
}
