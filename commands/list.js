const config = require('./util/commandTypeCheck');

function findLast(list, check) {
  for (let i = list.length; i-- > 0; ) {
    if (check(list[i])) {
      return i;
    }
  }
  return -1;
}

function findIndicesReversed(list, check) {
  const indices = [];
  for (let i = list.length; i-- > 0; ) {
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

const commands = {
  push: config(
    'array',
    'value...',
  )((object, values) => (values.length ? [...object, ...values] : object)),

  unshift: config(
    'array',
    'value...',
  )((object, values) => (values.length ? [...values, ...object] : object)),

  splice: config(
    'array',
    'array...',
  )((object, splices, context) => {
    let updatedObject = null;
    splices.forEach((args) => {
      context.invariant(
        Array.isArray(args),
        'expected splice parameter to be an array of arguments to splice()',
      );
      if (args.length && (args[1] !== 0 || args.length > 2)) {
        updatedObject = updatedObject || context.copy(object);
        Array.prototype.splice.apply(updatedObject, args);
      }
    });
    return updatedObject || object;
  }),

  insertBeforeFirstWhere: config(
    'array',
    'condition',
    'value...',
  )((object, [condition, ...items], context) => {
    const predicate = context.makeConditionPredicate(condition);
    let index = Array.prototype.findIndex.call(object, predicate);
    if (index === -1) {
      index = object.length;
    }
    return insertAtIndex(context, [index, items], object);
  }),

  insertAfterFirstWhere: config(
    'array',
    'condition',
    'value...',
  )((object, [condition, ...items], context) => {
    const predicate = context.makeConditionPredicate(condition);
    let index = Array.prototype.findIndex.call(object, predicate);
    if (index === -1) {
      index = object.length - 1;
    }
    return insertAtIndex(context, [index + 1, items], object);
  }),

  insertBeforeLastWhere: config(
    'array',
    'condition',
    'value...',
  )((object, [condition, ...items], context) => {
    const predicate = context.makeConditionPredicate(condition);
    let index = findLast(object, predicate);
    if (index === -1) {
      index = 0;
    }
    return insertAtIndex(context, [index, items], object);
  }),

  insertAfterLastWhere: config(
    'array',
    'condition',
    'value...',
  )((object, [condition, ...items], context) => {
    const predicate = context.makeConditionPredicate(condition);
    const index = findLast(object, predicate);
    return insertAtIndex(context, [index + 1, items], object);
  }),

  updateAll: config(
    'array',
    'spec',
  )((object, [spec], context) => {
    const combined = {};
    context.incLoopNesting(object.length, () => {
      for (let i = 0; i < object.length; i++) {
        const originalItem = object[i];
        const newItem = context.update(originalItem, spec, { allowUnset: true });
        if (!Object.is(newItem, originalItem)) {
          combined[i] = ['=', newItem];
        }
      }
    });
    return context.update(object, combined);
  }),

  updateWhere: config(
    'array',
    'condition',
    'spec',
    'elseInit:value?',
  )((object, [condition, spec, elseInit], context) => {
    const combined = {};
    const predicate = context.makeConditionPredicate(condition);
    let indices = findIndicesReversed(object, predicate);
    if (!indices.length && elseInit !== undefined) {
      indices = [object.length];
      object = [...object, elseInit];
    }
    context.incLoopNesting(indices.length, () => {
      indices.forEach((index) => {
        const originalItem = object[index];
        const newItem = context.update(originalItem, spec, { allowUnset: true });
        if (!Object.is(newItem, originalItem)) {
          combined[index] = ['=', newItem];
        }
      });
    });
    return context.update(object, combined);
  }),

  updateFirstWhere: config(
    'array',
    'condition',
    'spec',
    'elseInit:value?',
  )((object, [condition, spec, elseInit], context) => {
    const predicate = context.makeConditionPredicate(condition);
    let index = Array.prototype.findIndex.call(object, predicate);
    if (index === -1 && elseInit !== undefined) {
      index = object.length;
      object = [...object, elseInit];
    }
    return updateAtIndex(context, [index, spec], object);
  }),

  updateLastWhere: config(
    'array',
    'condition',
    'spec',
    'elseInit:value?',
  )((object, [condition, spec, elseInit], context) => {
    const predicate = context.makeConditionPredicate(condition);
    let index = findLast(object, predicate);
    if (index === -1 && elseInit !== undefined) {
      index = 0;
      object = [elseInit, ...object];
    }
    return updateAtIndex(context, [index, spec], object);
  }),

  deleteWhere: config(
    'array',
    'condition',
  )((object, [condition], context) => {
    const predicate = context.makeConditionPredicate(condition);
    const indices = findIndicesReversed(object, predicate);
    return context.update(object, ['splice', ...indices.map((i) => [i, 1])]);
  }),

  deleteFirstWhere: config(
    'array',
    'condition',
  )((object, [condition], context) => {
    const predicate = context.makeConditionPredicate(condition);
    const index = Array.prototype.findIndex.call(object, predicate);
    return updateAtIndex(context, [index, ['unset']], object);
  }),

  deleteLastWhere: config(
    'array',
    'condition',
  )((object, [condition], context) => {
    const predicate = context.makeConditionPredicate(condition);
    const index = findLast(object, predicate);
    return updateAtIndex(context, [index, ['unset']], object);
  }),
};

const listCommands = { commands };
module.exports = listCommands;
