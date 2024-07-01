function getScopedState(context, state, path, defaultValue = undefined) {
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
    } else {
      if (!Object.prototype.hasOwnProperty.call(state, item)) {
        return defaultValue;
      }
      state = state[item];
    }
  }
  return state;
}

function makeScopedSpec(path, spec, { initialisePath = false, initialiseValue = undefined } = {}) {
  if (initialiseValue !== undefined) {
    spec = ['seq', ['init', initialiseValue], spec];
  }
  for (let i = path.length; i-- > 0; ) {
    const part = path[i];
    let init;
    if (typeof part === 'object' && part) {
      init = [];
      if (initialisePath) {
        spec = ['updateWhere', part, spec, makeObjectMatchingCondition(part)];
      } else {
        spec = ['updateWhere', part, spec];
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
    return objectMatchingPart(cond).value;
  }
  if (cond.length === 2 && typeof cond[0] === 'string') {
    return { [cond[0]]: cond[1] };
  }
  if (cond.length === 1) {
    return objectMatchingPart(cond[0]).value;
  }
  const o = {};
  for (const c of cond) {
    const p = objectMatchingPart(c);
    if (p.keyed) {
      Object.assign(o, p.value);
    } else {
      return undefined; // condition is too complex for us
    }
  }
  return o;
}

function objectMatchingPart(c) {
  if (typeof c !== 'object' || !c || !Object.prototype.hasOwnProperty.call(c, 'equals')) {
    return undefined; // cannot make unambiguous objects which match an inequality
  }
  const keyed = Object.prototype.hasOwnProperty.call(c, 'key');
  return { keyed, value: keyed ? { [c.key]: c.equals } : c.equals };
}

function makeScopedReducer(
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

module.exports = { getScopedState, makeScopedSpec, makeScopedReducer };
