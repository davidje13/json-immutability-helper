export function getScopedState(context, state, path, defaultValue = undefined) {
  for (const item of path) {
    if (typeof state !== 'object' || !state) {
      return defaultValue;
    }
    if (typeof item === 'object') {
      if (!Array.isArray(state)) {
        return defaultValue;
      }
      const index = Array.prototype.findIndex.call(state, context.makeConditionPredicate(item));
      if (index === -1) {
        return defaultValue;
      }
      state = state[index];
    } else if (!Object.prototype.hasOwnProperty.call(state, item)) {
      return defaultValue;
    } else {
      state = state[item];
    }
  }
  return state;
}

export function makeScopedSpec(
  path,
  spec,
  { initialiseValue = undefined, initialisePath = initialiseValue !== undefined } = {},
) {
  if (initialiseValue !== undefined) {
    spec = ['seq', ['init', initialiseValue], spec];
  }
  for (let i = path.length; i-- > 0; ) {
    const part = path[i];
    let init;
    if (typeof part === 'object' && part) {
      init = [];
      if (initialisePath) {
        spec = ['update', 'all', part, spec, makeObjectMatchingCondition(part)];
      } else {
        spec = ['update', 'all', part, spec];
      }
    } else if (typeof part === 'number') {
      init = [];
      spec = { [part]: spec };
    } else if (typeof part === 'string') {
      init = {};
      spec = { [part]: spec };
    } else {
      throw new Error('unsupported path type');
    }
    if (initialisePath) {
      spec = ['seq', ['init', init], spec];
    }
  }
  return spec;
}

function makeObjectMatchingCondition(cond) {
  if (!Array.isArray(cond)) {
    return Object.fromEntries(
      Object.entries(cond).map(([k, v]) => [k, makeObjectMatchingCondition(v)]),
    );
  }
  if (cond.length !== 2 || cond[0] !== '=') {
    throw new Error('condition too complex');
  }
  return cond[1];
}

export function makeScopedReducer(
  context,
  { state, dispatch },
  path,
  { initialisePath = false, initialiseValue = undefined } = {},
) {
  const subState = getScopedState(context, state, path, initialiseValue);
  const subDispatch = (spec) =>
    dispatch(makeScopedSpec(path, spec, { initialisePath, initialiseValue }));
  return { state: subState, dispatch: subDispatch };
}
