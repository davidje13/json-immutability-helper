import { getScopedState, makeScopedSpec } from './scoped.mjs';

export function makeHooks(
  context,
  { useEvent, useLayoutEffect, useEffect, useRef, useState, useMemo, useReducer },
) {
  if (!useEvent) {
    useEvent = (fn) => {
      const latest = useRef(fn);
      (useLayoutEffect ?? useEffect)(() => {
        latest.current = fn;
      }, [fn]);
      const [stable] = useState(
        () =>
          (...args) =>
            latest.current.apply(undefined, args),
      );
      return stable;
    };
  }
  if (!useMemo) {
    useMemo = (fn) => fn();
  }

  let useJSONReducer;
  if (useReducer) {
    useJSONReducer = (initialArg, init) => {
      const [state, dispatch] = useReducer(context.update, initialArg, init);
      return useMemo(() => ({ state, dispatch }), [state, dispatch]);
    };
  } else {
    useJSONReducer = (initialArg, init = NOOP) => {
      const [state, setState] = useState(() => init(initialArg));
      const [dispatch] = useState(() => (spec) => setState((s) => context.update(s, spec)));
      return useMemo(() => ({ state, dispatch }), [state, dispatch]);
    };
  }

  return {
    useEvent,

    useJSONReducer,

    useWrappedJSONReducer([state, setState]) {
      const stableSetState = useEvent(setState);
      const [dispatch] = useState(() => (spec) => stableSetState((s) => context.update(s, spec)));
      return useMemo(() => ({ state, dispatch }), [state, dispatch]);
    },

    useScopedReducer(
      { state, dispatch },
      path,
      { initialiseValue = undefined, initialisePath = initialiseValue !== undefined } = {},
    ) {
      const subState = getScopedState(context, state, path, initialiseValue);
      const subDispatch = useEvent((spec) =>
        dispatch(makeScopedSpec(path, spec, { initialisePath, initialiseValue })),
      );
      return useMemo(() => ({ state: subState, dispatch: subDispatch }), [subState, subDispatch]);
    },
  };
}

const NOOP = (x) => x;
