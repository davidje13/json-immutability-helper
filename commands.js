const config = require('./commandTypeCheck');
const calc = require('./calc');
const { MAX_TOTAL_STRING_SIZE } = require('./limits');

function findLast(list, check) {
  for (let i = list.length; (i--) > 0;) {
    if (check(list[i])) {
      return i;
    }
  }
  return -1;
}

function findIndicesReversed(list, check) {
  const indices = [];
  for (let i = list.length; (i--) > 0;) {
    if (check(list[i])) {
      indices.push(i);
    }
  }
  return indices;
}

function insertAtIndex(context, [index, items], original) {
  return context.update(original, ['splice', [index, 0, ...items]]);
}

function updateAtIndex(context, [index, spec], original) {
  if (index === -1) {
    return original;
  }
  const originalItem = original[index];
  const newItem = context.update(originalItem, spec, { allowUnset: true });
  return context.update(original, { [index]: ['=', newItem] });
}

function makeRpnCommand(inputType, funcs) {
  return config(inputType, 'operations:primitive...')((
    object,
    tokens,
    context
  ) => {
    const result = calc.applyReversePolish(tokens, { x: object }, funcs);
    context.invariant(
      typeof object === typeof result,
      'cannot change type of property'
    );
    return result;
  });
}

const defaultCommands = {
  set: config('*', 'value')((object, [value]) => value),

  unset: config('*')((object, options, context) => context.UNSET_TOKEN),

  init: config('*', 'value')((object, [value]) => (
    (object === undefined) ? value : object
  )),

  updateIf: config('*', 'condition', 'spec', 'spec?')((
    object,
    [condition, spec, elseSpec = null],
    context
  ) => {
    const check = context.makeConditionPredicate(condition);
    if (!check(object)) {
      if (!elseSpec) {
        return object;
      }
      return context.update(object, elseSpec, { allowUnset: true });
    }
    return context.update(object, spec, { allowUnset: true });
  }),

  seq: config('*', 'spec...')((object, specs, context) => specs.reduce(
    (o, spec) => context.update(o, spec, { allowUnset: true }),
    object
  )),

  toggle: config('boolean')((object) => !object),

  push: config('array', 'value...')((object, values) => (
    values.length ? Array.prototype.concat.call(object, values) : object
  )),

  unshift: config('array', 'value...')((object, values) => (
    values.length ? Array.prototype.concat.call(values, object) : object
  )),

  splice: config('array', 'array...')((object, splices, context) => {
    let updatedObject = null;
    splices.forEach((args) => {
      context.invariant(
        Array.isArray(args),
        'expected splice parameter to be an array of arguments to splice()'
      );
      if (args.length && (args[1] !== 0 || args.length > 2)) {
        updatedObject = updatedObject || context.copy(object);
        Array.prototype.splice.apply(updatedObject, args);
      }
    });
    return updatedObject || object;
  }),

  merge: config('object?', 'merge:object', 'initial:object?')((
    object,
    [value, init],
    context
  ) => {
    const initedObject = (object === undefined) ? init : object;
    return context.applyMerge(initedObject, Object.entries(value));
  }),

  insertBeforeFirstWhere: config('array', 'condition', 'value...')((
    object,
    [condition, ...items],
    context
  ) => {
    const predicate = context.makeConditionPredicate(condition);
    let index = Array.prototype.findIndex.call(object, predicate);
    if (index === -1) {
      index = object.length;
    }
    return insertAtIndex(context, [index, items], object);
  }),

  insertAfterFirstWhere: config('array', 'condition', 'value...')((
    object,
    [condition, ...items],
    context
  ) => {
    const predicate = context.makeConditionPredicate(condition);
    let index = Array.prototype.findIndex.call(object, predicate);
    if (index === -1) {
      index = object.length - 1;
    }
    return insertAtIndex(context, [index + 1, items], object);
  }),

  insertBeforeLastWhere: config('array', 'condition', 'value...')((
    object,
    [condition, ...items],
    context
  ) => {
    const predicate = context.makeConditionPredicate(condition);
    let index = findLast(object, predicate);
    if (index === -1) {
      index = 0;
    }
    return insertAtIndex(context, [index, items], object);
  }),

  insertAfterLastWhere: config('array', 'condition', 'value...')((
    object,
    [condition, ...items],
    context
  ) => {
    const predicate = context.makeConditionPredicate(condition);
    const index = findLast(object, predicate);
    return insertAtIndex(context, [index + 1, items], object);
  }),

  updateAll: config('array', 'spec')((object, [spec], context) => {
    const combined = {};
    context.incLoopNesting(object.length, () => {
      for (let i = 0; i < object.length; i++) {
        const originalItem = object[i];
        const newItem = context.update(originalItem, spec);
        combined[i] = ['=', newItem];
      }
    });
    return context.update(object, combined);
  }),

  updateWhere: config('array', 'condition', 'spec')((
    object,
    [condition, spec],
    context
  ) => {
    const combined = {};
    const predicate = context.makeConditionPredicate(condition);
    const indices = findIndicesReversed(object, predicate);
    context.incLoopNesting(indices.length, () => {
      indices.forEach((index) => {
        const originalItem = object[index];
        const newItem = context.update(originalItem, spec);
        combined[index] = ['=', newItem];
      });
    });
    return context.update(object, combined);
  }),

  updateFirstWhere: config('array', 'condition', 'spec')((
    object,
    [condition, spec],
    context
  ) => {
    const predicate = context.makeConditionPredicate(condition);
    const index = Array.prototype.findIndex.call(object, predicate);
    return updateAtIndex(context, [index, spec], object);
  }),

  updateLastWhere: config('array', 'condition', 'spec')((
    object,
    [condition, spec],
    context
  ) => {
    const predicate = context.makeConditionPredicate(condition);
    const index = findLast(object, predicate);
    return updateAtIndex(context, [index, spec], object);
  }),

  deleteWhere: config('array', 'condition')((
    object,
    [condition],
    context
  ) => {
    const predicate = context.makeConditionPredicate(condition);
    const indices = findIndicesReversed(object, predicate);
    return context.update(object, ['splice', ...indices.map((i) => [i, 1])]);
  }),

  deleteFirstWhere: config('array', 'condition')((
    object,
    [condition],
    context
  ) => {
    const predicate = context.makeConditionPredicate(condition);
    const index = Array.prototype.findIndex.call(object, predicate);
    return updateAtIndex(context, [index, ['unset']], object);
  }),

  deleteLastWhere: config('array', 'condition')((
    object,
    [condition],
    context
  ) => {
    const predicate = context.makeConditionPredicate(condition);
    const index = findLast(object, predicate);
    return updateAtIndex(context, [index, ['unset']], object);
  }),

  add: config('number', 'number')((object, [value]) => object + value),

  subtract: config('number', 'number')((object, [value]) => object - value),

  rpn: makeRpnCommand('number', calc.MATH_FUNCTIONS),
};

const riskyStringCommands = {
  replaceAll: config('string', 'find:string', 'replace:string')((
    object,
    [find, replace],
    context
  ) => {
    if (!find || find === replace) {
      return object;
    }
    const parts = String.prototype.split.call(object, find);
    if (replace.length > find.length) {
      const count = parts.length - 1;
      const diff = count * (replace.length - find.length);
      context.invariant(
        object.length + diff <= MAX_TOTAL_STRING_SIZE,
        'too much data'
      );
      context.incLoopNesting(count, () => null);
    }
    return parts.join(replace);
  }),

  rpn: makeRpnCommand('primitive', calc.ALL_FUNCTIONS),
};

// Aliases
defaultCommands['='] = defaultCommands.set;
defaultCommands['+'] = defaultCommands.add;
defaultCommands['-'] = defaultCommands.subtract;
defaultCommands['~'] = defaultCommands.toggle;

module.exports = {
  defaultCommands,
  riskyStringCommands,
};
