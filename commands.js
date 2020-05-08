const config = require('./commandTypeCheck');
const calc = require('./calc');

const UNSAFE_REGEXP = /[/\\^$*+?.()|[\]{}]/g;
function literalRegExp(input, flags) {
  const escaped = input.replace(UNSAFE_REGEXP, '\\$&');
  return new RegExp(escaped, flags);
}

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
    values.length ? object.concat(values) : object
  )),

  unshift: config('array', 'value...')((object, values) => (
    values.length ? values.concat(object) : object
  )),

  splice: config('array', 'array...')((object, splices, context) => {
    let updatedObject = null;
    splices.forEach((args) => {
      context.invariant(
        Array.isArray(args),
        'expected splice parameter to be an array of arguments to splice()'
      );
      if (args.length && (args[1] !== 0 || args.length > 2)) {
        if (!updatedObject) {
          updatedObject = context.copy(object);
        }
        Array.prototype.splice.apply(updatedObject, args);
      }
    });
    return updatedObject || object;
  }),

  merge: config('object', 'object')((object, [value], context) => {
    let updatedObject = null;
    Object.keys(value).forEach((key) => {
      if (value[key] !== object[key]) {
        if (!updatedObject) {
          updatedObject = context.copy(object);
        }
        if (value[key] === context.UNSET_TOKEN) {
          delete updatedObject[key];
        } else {
          updatedObject[key] = value[key];
        }
      }
    });
    return updatedObject || object;
  }),

  insertBeforeFirstWhere: config('array', 'condition', 'value...')((
    object,
    [condition, ...items],
    context
  ) => {
    let index = object.findIndex(context.makeConditionPredicate(condition));
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
    let index = object.findIndex(context.makeConditionPredicate(condition));
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
    let index = findLast(object, context.makeConditionPredicate(condition));
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
    const index = findLast(object, context.makeConditionPredicate(condition));
    return insertAtIndex(context, [index + 1, items], object);
  }),

  updateAll: config('array', 'spec')((object, [spec], context) => {
    const combined = {};
    for (let i = 0; i < object.length; i++) {
      const originalItem = object[i];
      const newItem = context.update(originalItem, spec);
      combined[i] = ['=', newItem];
    }
    return context.update(object, combined);
  }),

  updateWhere: config('array', 'condition', 'spec')((
    object,
    [condition, spec],
    context
  ) => {
    const combined = {};
    const indices = findIndicesReversed(
      object,
      context.makeConditionPredicate(condition)
    );
    indices.forEach((index) => {
      const originalItem = object[index];
      const newItem = context.update(originalItem, spec);
      combined[index] = ['=', newItem];
    });
    return context.update(object, combined);
  }),

  updateFirstWhere: config('array', 'condition', 'spec')((
    object,
    [condition, spec],
    context
  ) => {
    const index = object.findIndex(context.makeConditionPredicate(condition));
    return updateAtIndex(context, [index, spec], object);
  }),

  updateLastWhere: config('array', 'condition', 'spec')((
    object,
    [condition, spec],
    context
  ) => {
    const index = findLast(object, context.makeConditionPredicate(condition));
    return updateAtIndex(context, [index, spec], object);
  }),

  deleteWhere: config('array', 'condition')((
    object,
    [condition],
    context
  ) => {
    const indices = findIndicesReversed(
      object,
      context.makeConditionPredicate(condition)
    );
    return context.update(object, ['splice', ...indices.map((i) => [i, 1])]);
  }),

  deleteFirstWhere: config('array', 'condition')((
    object,
    [condition],
    context
  ) => {
    const index = object.findIndex(context.makeConditionPredicate(condition));
    return updateAtIndex(context, [index, ['unset']], object);
  }),

  deleteLastWhere: config('array', 'condition')((
    object,
    [condition],
    context
  ) => {
    const index = findLast(object, context.makeConditionPredicate(condition));
    return updateAtIndex(context, [index, ['unset']], object);
  }),

  replaceAll: config('string', 'find:string', 'replace:string')((
    object,
    [find, replace]
  ) => object.replace(literalRegExp(find, 'g'), replace)),

  add: config('number', 'number')((object, [value]) => object + value),

  subtract: config('number', 'number')((object, [value]) => object - value),

  rpn: makeRpnCommand('number', calc.MATH_FUNCTIONS),
};

const riskyStringCommands = {
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
