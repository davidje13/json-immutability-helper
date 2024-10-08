import config from './util/commandTypeCheck.mjs';

function interpretOrdinal(ordinal) {
  if (ordinal === 'all') {
    return { _rev: true, _pred: () => 1, _insert: 0 };
  } else if (ordinal === 'first') {
    ordinal = 0;
  } else if (ordinal === 'last') {
    ordinal = -1;
  }
  if (ordinal < 0) {
    return { _rev: true, _pred: (n) => (n === -ordinal - 1 ? 2 : 0), _insert: -1 };
  } else {
    return { _rev: false, _pred: (n) => (n === ordinal ? 2 : 0), _insert: 1 };
  }
}

function findIndicesReversed(object, locator, context) {
  const size = object.length;

  let ordinal;
  let predicate;
  if (Array.isArray(locator)) {
    ordinal = locator[0];
    predicate = context.makeConditionPredicate(locator[1]);
  } else if (typeof locator === 'number') {
    if (locator >= size || locator < -size) {
      return { _indices: [], _insert: Math.sign(locator) };
    }
    if (locator < 0) {
      return { _indices: [size + locator] };
    }
    return { _indices: [locator] };
  } else {
    ordinal = locator;
    predicate = () => true;
  }

  const o = interpretOrdinal(ordinal);
  const indices = [];
  if (o._rev) {
    for (let i = size, n = 0; i-- > 0; ) {
      if (predicate(object[i])) {
        const match = o._pred(n++);
        if (match) {
          indices.push(i);
          if (match === 2) {
            break;
          }
        }
      }
    }
  } else {
    for (let i = 0, n = 0; i < size; ++i) {
      if (predicate(object[i])) {
        const match = o._pred(n++);
        if (match) {
          indices.push(i);
          if (match === 2) {
            break;
          }
        }
      }
    }
    indices.reverse();
  }
  return { _indices: indices, _insert: o._insert };
}

function isSameList(context, list1, list2) {
  const n = list1.length;
  if (list2.length !== n) {
    return false;
  }
  for (let i = 0; i < n; ++i) {
    if (!context.isEquals(list1[i], list2[i])) {
      return false;
    }
  }
  return true;
}

const isPrimitive = (v) => (v === null || typeof v !== 'object') && typeof v !== 'function';

const commands = {
  push: config(
    'array',
    'value...',
  )((object, values) => (values.length ? [...object, ...values] : object)),

  unshift: config(
    'array',
    'value...',
  )((object, values) => (values.length ? [...values, ...object] : object)),

  addUnique: config(
    'array',
    'value...',
  )((object, values, context) => {
    context.invariant(values.every(isPrimitive), 'cannot add non-primitives');
    const unique = new Set(values.filter((v) => !object.includes(v)));
    return unique.size ? [...object, ...unique] : object;
  }),

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
        updatedObject ||= context.copy(object);
        Array.prototype.splice.apply(updatedObject, args);
      }
    });
    if (updatedObject && !isSameList(context, object, updatedObject)) {
      return updatedObject;
    }
    return object;
  }),

  insert: config(
    'array',
    'enum[before,after]',
    'multi-locator',
    'value...',
  )((object, [position, locator, ...items], context) => {
    const size = object.length;
    const { _indices: indices, _insert: insert } = findIndicesReversed(object, locator, context);
    if (!indices.length && insert) {
      indices.push(insert > 0 ? size : -1);
    }
    const offset = position === 'before' ? 0 : 1;
    return context.incLoopNesting(indices.length, () =>
      context.update(object, [
        'splice',
        ...indices.map((i) => [Math.max(0, Math.min(size, i + offset)), 0, ...items]),
      ]),
    );
  }),

  update: config(
    'array',
    'multi-locator',
    'spec',
    'elseInit:value?',
  )((object, [locator, spec, elseInit], context) => {
    const combined = {};
    const { _indices: indices, insertStart } = findIndicesReversed(object, locator, context);
    if (!indices.length && elseInit !== undefined) {
      if (insertStart) {
        indices.push(0);
        object = [elseInit, ...object];
      } else {
        indices.push(object.length);
        object = [...object, elseInit];
      }
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

  delete: config(
    'array',
    'multi-locator',
  )((object, [locator], context) => {
    const { _indices: indices } = findIndicesReversed(object, locator, context);
    return context.update(object, ['splice', ...indices.map((i) => [i, 1])]);
  }),

  swap: config(
    'array',
    'single-locator',
    'single-locator',
  )((object, [locator1, locator2], context) => {
    const { _indices: indices1 } = findIndicesReversed(object, locator1, context);
    const { _indices: indices2 } = findIndicesReversed(object, locator2, context);
    if (indices1.length !== 1 || indices2.length !== 1) {
      return object;
    }
    const [i1] = indices1;
    const [i2] = indices2;
    const v1 = object[i1];
    const v2 = object[i2];
    if (i1 === i2 || context.isEquals(v1, v2)) {
      return object;
    }
    const updated = [...object];
    updated[i1] = v2;
    updated[i2] = v1;
    return updated;
  }),

  move: config(
    'array',
    'multi-locator',
    'enum[before,after]',
    'single-locator',
  )((object, [locator1, position, locator2], context) => {
    const { _indices: indices1 } = findIndicesReversed(object, locator1, context);
    const { _indices: indices2 } = findIndicesReversed(object, locator2, context);
    indices1.reverse();
    if (indices1.length === 0 || indices2.length !== 1) {
      return object;
    }
    if (indices1.includes(indices2[0])) {
      return object;
    }
    const values = indices1.map((i) => object[i]);
    const target = indices2[0] + (position === 'after' ? 1 : 0);
    const updatedObject = [];
    for (let i = 0, k = 0; i < object.length; ++i) {
      if (i === indices1[k]) {
        ++k;
        continue;
      }
      if (i === target) {
        updatedObject.push(...values);
      }
      updatedObject.push(object[i]);
    }
    if (target === object.length) {
      updatedObject.push(...values);
    }
    return isSameList(context, object, updatedObject) ? object : updatedObject;
  }),
};

const conditions = {
  length: ([subCondition], context) => {
    const predicate = context.makeConditionPredicate(subCondition);
    return (v) => Array.isArray(v) && predicate(v.length);
  },
  some: ([subCondition], context) => {
    const predicate = context.makeConditionPredicate(subCondition);
    return (v) => Array.isArray(v) && Array.prototype.some.call(v, predicate);
  },
  every: ([subCondition], context) => {
    const predicate = context.makeConditionPredicate(subCondition);
    return (v) => Array.isArray(v) && Array.prototype.every.call(v, predicate);
  },
  none: ([subCondition], context) => {
    const predicate = context.makeConditionPredicate(subCondition);
    return (v) => Array.isArray(v) && !Array.prototype.some.call(v, predicate);
  },
};

export default { commands, conditions };
