const { Context } = require('immutability-helper');
const invariant = require('invariant');

// Use a new context to avoid polluting native immutability-helper
const defaultContext = new Context();
const { update } = defaultContext;

const UNSAFE_REGEXP = /[/\\^$*+?.()|[\]{}]/g;
function makeLiteralRegExp(input, flags) {
  const escaped = input.replace(UNSAFE_REGEXP, '\\$&');
  return new RegExp(escaped, flags);
}

function numericInvariant(value, original, command) {
  invariant(
    typeof value === 'number',
    'update(): expected spec of %s to be a number; got %s.',
    command,
    value
  );
  invariant(
    typeof original === 'number',
    'update(): expected target of %s to be a number; got %s.',
    command,
    original
  );
}

const conditionTypes = {
  equals: (c) => (v) => (v === c),
  not: (c) => (v) => (v !== c),
  greaterThan: (c) => (v) => (v > c),
  lessThan: (c) => (v) => (v < c),
  greaterThanOrEqual: (c) => (v) => (v >= c),
  lessThanOrEqual: (c) => (v) => (v <= c),
};

function makeConditionFnPart(condition) {
  invariant(
    typeof condition === 'object',
    'update(): expected spec of condition to be an object; got %s.',
    condition
  );

  const checks = Object.keys(condition)
    .filter((key) => (key !== 'key'))
    .map((key) => {
      invariant(conditionTypes[key], 'Unknown condition type: %s.', key);
      return conditionTypes[key](condition[key]);
    });

  if (condition.key !== undefined) {
    if (!checks.length) {
      return (o) => (o[condition.key] !== undefined);
    }
    return (o) => checks.every((c) => c(o[condition.key]));
  }

  invariant(
    checks.length > 0,
    'update(): unknown condition type %s.',
    condition
  );

  return (o) => checks.every((c) => c(o));
}

function makeConditionFn(condition) {
  if (Array.isArray(condition)) {
    invariant(condition.length > 0, 'update(): empty condition.');

    if (typeof condition[0] === 'string' && condition.length === 2) {
      return makeConditionFnPart({key: condition[0], equals: condition[1]});
    }

    const parts = condition.map(makeConditionFnPart);
    return (o) => parts.every((part) => part(o));
  }
  return makeConditionFnPart(condition);
}

function findFirst(list, condition) {
  const check = makeConditionFn(condition);
  return list.findIndex(check);
}

function findLast(list, condition) {
  const check = makeConditionFn(condition);
  for (let i = list.length; (i--) > 0;) {
    if (check(list[i])) {
      return i;
    }
  }
  return -1;
}

function findAllReversed(list, condition) {
  const indices = [];
  const check = makeConditionFn(condition);
  for (let i = list.length; (i--) > 0;) {
    if (check(list[i])) {
      indices.push(i);
    }
  }
  return indices;
}

function insertAtIndex([index, items], original) {
  return update(original, { $splice: [[index, 0, ...items]] });
}

function updateAtIndex([index, spec], original) {
  if (index === -1) {
    return original;
  }
  const originalItem = original[index];
  const newItem = update(originalItem, spec);
  return update(original, { [index]: { $set: newItem } });
}

function deleteAtIndex(index, original) {
  if (index === -1) {
    return original;
  }
  return update(original, { $splice: [[index, 1]] });
}

update.extendAll = function(commands) {
  Object.keys(commands).forEach((name) => {
    this.extend(name, commands[name]);
  });
};

update.extendCondition = function(name, condition) {
  conditionTypes[name] = condition;
};

update.extendConditionAll = function(conditions) {
  Object.keys(conditions).forEach((name) => {
    this.extendCondition(name, conditions[name]);
  });
};

update.extendAll({
  $apply: () => {
    invariant(false, 'Cannot use $apply (not JSON-safe)');
  },

  $updateIf: ([condition, spec, elseSpec = null], original) => {
    if (!makeConditionFn(condition)(original)) {
      if (elseSpec) {
        return update(original, elseSpec);
      }
      return original;
    }
    return update(original, spec);
  },

  $insertBeforeFirstWhere: ([condition, ...items], original) => {
    let index = findFirst(original, condition);
    if (index === -1) {
      index = original.length;
    }
    return insertAtIndex([index, items], original);
  },

  $insertAfterFirstWhere: ([condition, ...items], original) => {
    let index = findFirst(original, condition);
    if (index === -1) {
      index = original.length - 1;
    }
    return insertAtIndex([index + 1, items], original);
  },

  $insertBeforeLastWhere: ([condition, ...items], original) => {
    let index = findLast(original, condition);
    if (index === -1) {
      index = 0;
    }
    return insertAtIndex([index, items], original);
  },

  $insertAfterLastWhere: ([condition, ...items], original) => {
    const index = findLast(original, condition);
    return insertAtIndex([index + 1, items], original);
  },

  $updateAll: (spec, original) => {
    const combined = {};
    for (let i = 0; i < original.length; i++) {
      const originalItem = original[i];
      const newItem = update(originalItem, spec);
      combined[i] = { $set: newItem };
    }
    return update(original, combined);
  },

  $updateWhere: ([condition, spec], original) => {
    const combined = {};
    findAllReversed(original, condition).forEach((index) => {
      const originalItem = original[index];
      const newItem = update(originalItem, spec);
      combined[index] = { $set: newItem };
    });
    return update(original, combined);
  },

  $updateFirstWhere: ([condition, spec], original) => {
    const index = findFirst(original, condition);
    return updateAtIndex([index, spec], original);
  },

  $updateLastWhere: ([condition, spec], original) => {
    const index = findLast(original, condition);
    return updateAtIndex([index, spec], original);
  },

  $deleteWhere: (condition, original) => {
    const indices = findAllReversed(original, condition);
    return update(original, { $splice: indices.map((i) => [i, 1]) });
  },

  $deleteFirstWhere: (condition, original) => {
    const index = findFirst(original, condition);
    return deleteAtIndex(index, original);
  },

  $deleteLastWhere: (condition, original) => {
    const index = findLast(original, condition);
    return deleteAtIndex(index, original);
  },

  $replaceAll: ([search, replacement], original) => {
    invariant(
      typeof search === 'string' && typeof replacement === 'string',
      'update(): expected spec of $replaceAll to be [find, replace]; got %s.',
      [search, replacement]
    );
    const pattern = makeLiteralRegExp(search, 'g');
    return String(original).replace(pattern, replacement);
  },

  $add: (value, original) => {
    numericInvariant(value, original, '$add');
    return original + value;
  },

  $subtract: (value, original) => {
    numericInvariant(value, original, '$subtract');
    return original - value;
  },

  $multiply: (value, original) => {
    numericInvariant(value, original, '$multiply');
    return original * value;
  },

  $divide: (value, original) => {
    numericInvariant(value, original, '$divide');
    return original / value;
  },

  $reciprocal: (value, original) => {
    numericInvariant(value, original, '$reciprocal');
    return value / original;
  },
});

// Match export style of immutability-helper for compatibility
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = defaultContext.update;
module.exports = Object.assign(exports.default, exports);
exports.default.default = module.exports;
