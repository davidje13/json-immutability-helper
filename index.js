const { Context } = require('immutability-helper');
const invariant = require('invariant');

const defaultConditions = {
  equals: (c) => (v) => (v === c),
  not: (c) => (v) => (v !== c),
  greaterThan: (c) => (v) => (v > c),
  lessThan: (c) => (v) => (v < c),
  greaterThanOrEqual: (c) => (v) => (v >= c),
  lessThanOrEqual: (c) => (v) => (v <= c),
};

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
  return context.update(original, { $splice: [[index, 0, ...items]] });
}

function updateAtIndex(context, [index, spec], original) {
  if (index === -1) {
    return original;
  }
  const originalItem = original[index];
  const newItem = context.update(originalItem, spec);
  return context.update(original, { [index]: { $set: newItem } });
}

function deleteAtIndex(context, index, original) {
  if (index === -1) {
    return original;
  }
  return context.update(original, { $splice: [[index, 1]] });
}

function applyExtensions(context) {
  const first = (list, condition) => list.findIndex(
    context.makeConditionPredicate(condition)
  );

  const last = (list, condition) => findLast(
    list,
    context.makeConditionPredicate(condition)
  );

  const indicesReversed = (list, condition) => findIndicesReversed(
    list,
    context.makeConditionPredicate(condition)
  );

  context.extendAll({
    $apply: () => invariant(false, 'Cannot use $apply (not JSON-safe)'),

    $updateIf: ([condition, spec, elseSpec = null], original) => {
      const check = context.makeConditionPredicate(condition);
      if (!check(original)) {
        if (elseSpec) {
          return context.update(original, elseSpec);
        }
        return original;
      }
      return context.update(original, spec);
    },

    $insertBeforeFirstWhere: ([condition, ...items], original) => {
      let index = first(original, condition);
      if (index === -1) {
        index = original.length;
      }
      return insertAtIndex(context, [index, items], original);
    },

    $insertAfterFirstWhere: ([condition, ...items], original) => {
      let index = first(original, condition);
      if (index === -1) {
        index = original.length - 1;
      }
      return insertAtIndex(context, [index + 1, items], original);
    },

    $insertBeforeLastWhere: ([condition, ...items], original) => {
      let index = last(original, condition);
      if (index === -1) {
        index = 0;
      }
      return insertAtIndex(context, [index, items], original);
    },

    $insertAfterLastWhere: ([condition, ...items], original) => {
      const index = last(original, condition);
      return insertAtIndex(context, [index + 1, items], original);
    },

    $updateAll: (spec, original) => {
      const combined = {};
      for (let i = 0; i < original.length; i++) {
        const originalItem = original[i];
        const newItem = context.update(originalItem, spec);
        combined[i] = { $set: newItem };
      }
      return context.update(original, combined);
    },

    $updateWhere: ([condition, spec], original) => {
      const combined = {};
      indicesReversed(original, condition).forEach((index) => {
        const originalItem = original[index];
        const newItem = context.update(originalItem, spec);
        combined[index] = { $set: newItem };
      });
      return context.update(original, combined);
    },

    $updateFirstWhere: ([condition, spec], original) => {
      const index = first(original, condition);
      return updateAtIndex(context, [index, spec], original);
    },

    $updateLastWhere: ([condition, spec], original) => {
      const index = last(original, condition);
      return updateAtIndex(context, [index, spec], original);
    },

    $deleteWhere: (condition, original) => {
      const indices = indicesReversed(original, condition);
      return context.update(original, { $splice: indices.map((i) => [i, 1]) });
    },

    $deleteFirstWhere: (condition, original) => {
      const index = first(original, condition);
      return deleteAtIndex(context, index, original);
    },

    $deleteLastWhere: (condition, original) => {
      const index = last(original, condition);
      return deleteAtIndex(context, index, original);
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
}

class JsonContext extends Context {
  constructor() {
    super();
    this.conditionTypes = Object.assign({}, defaultConditions);
    this.extendAll = this.extendAll.bind(this);
    this.extendCondition = this.extendCondition.bind(this);
    this.extendConditionAll = this.extendConditionAll.bind(this);
    this.internalConditionPart = this.internalConditionPart.bind(this);
    applyExtensions(this);
  }

  extendAll(commands) {
    Object.keys(commands).forEach((name) => {
      this.extend(name, commands[name]);
    });
  }

  extendCondition(name, condition) {
    this.conditionTypes[name] = condition;
  }

  extendConditionAll(conditions) {
    Object.keys(conditions).forEach((name) => {
      this.extendCondition(name, conditions[name]);
    });
  }

  internalConditionPart(condition) {
    invariant(
      typeof condition === 'object',
      'update(): expected spec of condition to be an object; got %s.',
      condition
    );

    const checks = Object.keys(condition)
      .filter((key) => (key !== 'key'))
      .map((key) => {
        invariant(this.conditionTypes[key], 'Unknown condition type: %s.', key);
        return this.conditionTypes[key](condition[key]);
      });

    if (condition.key !== undefined) {
      if (!checks.length) {
        return (o) => (o[condition.key] !== undefined);
      }
      return (o) => checks.every((c) => c(o[condition.key]));
    }

    invariant(checks.length > 0, 'update(): unknown condition %s.', condition);

    return (o) => checks.every((c) => c(o));
  }

  makeConditionPredicate(condition) {
    if (Array.isArray(condition)) {
      invariant(condition.length > 0, 'update(): empty condition.');

      if (typeof condition[0] === 'string' && condition.length === 2) {
        return this.internalConditionPart({
          key: condition[0],
          equals: condition[1],
        });
      }

      const parts = condition.map(this.internalConditionPart);
      return (o) => parts.every((part) => part(o));
    }
    return this.internalConditionPart(condition);
  }
}

const defaultContext = new JsonContext();

// Match export style of immutability-helper for compatibility
Object.defineProperty(exports, '__esModule', { value: true });

exports.Context = JsonContext;
exports.isEquals = defaultContext.update.isEquals;
exports.extend = defaultContext.extend;
exports.extendAll = defaultContext.extendAll;
exports.extendCondition = defaultContext.extendCondition;
exports.extendConditionAll = defaultContext.extendConditionAll;
exports.default = defaultContext.update;

module.exports = Object.assign(exports.default, exports);
exports.default.default = module.exports;
