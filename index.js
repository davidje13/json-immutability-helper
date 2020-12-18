const defaultConditions = require('./conditions');
const { defaultCommands, riskyStringCommands } = require('./commands');
const {
  MAX_RECURSION_DEPTH,
  MAX_RECURSION_BREADTH,
} = require('./limits');

function invariant(condition, msgFn) {
  if (!condition) {
    const msg = typeof msgFn === 'function' ? msgFn() : msgFn || 'bad input';
    throw new Error(msg);
  }
}

const isOp = Array.isArray;
const isEquals = (x, y) => (x === y);
const copy = (o) => (
  Array.isArray(o) ? [...o] :
    (typeof o === 'object' && o) ? Object.assign({}, o) :
      o
);

function getSeqSteps(spec) {
  if (isOp(spec) && spec[0] === 'seq') {
    return spec.slice(1);
  }
  return [spec];
}

function combineSpecs(spec1, spec2) {
  if (isOp(spec1) || isOp(spec2)) {
    return ['seq', ...getSeqSteps(spec1), ...getSeqSteps(spec2)];
  }

  const result = Object.assign({}, spec1);
  Object.keys(spec2).forEach((key) => {
    if (result[key] === undefined) {
      result[key] = spec2[key];
    } else {
      result[key] = combineSpecs(result[key], spec2[key]);
    }
  });
  return result;
}

function conditionPartPredicate(condition, context) {
  invariant(
    typeof condition === 'object',
    () => `expected spec of condition to be an object; got ${condition}`
  );

  const checks = Object.keys(condition)
    .filter((key) => (key !== 'key'))
    .map((key) => {
      const type = context.conditionTypes.get(key);
      invariant(type, () => `unknown condition type: ${key}`);
      return type(condition[key]);
    });

  if (condition.key !== undefined) {
    if (!checks.length) {
      return (o) => (o[condition.key] !== undefined);
    }
    return (o) => checks.every((c) => c(o[condition.key]));
  }

  invariant(checks.length > 0, () => `unknown condition ${condition}`);

  return (o) => checks.every((c) => c(o));
}

function deleteIndices(arr, indices) {
  indices.sort((a, b) => (a - b));
  let del = 1;
  for (let i = indices[0] + 1; i < arr.length; ++i) {
    if (i === indices[del]) {
      ++del;
    } else {
      arr[i - del] = arr[i];
    }
  }
  arr.length -= del;
}

function makeKeyChecker(object, path = '') {
  if (!Array.isArray(object)) {
    return () => null;
  }

  const { length } = object;
  return (key) => {
    const index = Number(key);
    if (index < 0 || index >= length || index.toFixed(0) !== key) {
      throw new Error(`/${path}: cannot modify array property ${key}`);
    }
  };
}

const UNSET_TOKEN = Symbol('unset');

function bindAll(o, fns) {
  fns.forEach((fn) => {
    o[fn] = o[fn].bind(o);
  });
}

class JsonContext {
  constructor() {
    Object.assign(this, {
      commands: new Map(),
      conditionTypes: new Map(),
      nestDepth: 0,
      nestBreadth: 1,
      isEquals,
      copy,
      UNSET_TOKEN,
      invariant,
    });

    bindAll(this, [
      'extend',
      'extendAll',
      'extendCondition',
      'extendConditionAll',
      'update',
      'applyMerge',
      'combine',
      'makeConditionPredicate',
    ]);

    Object.assign(this.update, {
      combine: this.combine,
      UNSET_TOKEN: this.UNSET_TOKEN,
    });

    this.extendAll(defaultCommands);
    this.extendConditionAll(defaultConditions);
  }

  extend(name, fn) {
    this.commands.set(name, fn);
  }

  extendAll(commands) {
    Object.keys(commands).forEach((name) => {
      this.commands.set(name, commands[name]);
    });
  }

  extendCondition(name, condition) {
    this.conditionTypes.set(name, condition);
  }

  extendConditionAll(conditions) {
    Object.keys(conditions).forEach((name) => {
      this.conditionTypes.set(name, conditions[name]);
    });
  }

  enableRiskyStringOps() {
    this.extendAll(riskyStringCommands);
  }

  /* eslint-disable-next-line max-statements */
  update(object, spec, { path = '', allowUnset = false } = {}) {
    const initial = (object === UNSET_TOKEN) ? undefined : object;

    if (isOp(spec)) {
      const [commandName, ...options] = spec;
      const command = this.commands.get(commandName);
      try {
        invariant(command, 'unknown command');
        const updated = command(initial, options, this);
        if (updated === UNSET_TOKEN) {
          return allowUnset ? UNSET_TOKEN : undefined;
        }
        return this.isEquals(updated, initial) ? initial : updated;
      } catch (e) {
        throw new Error(`/${path} ${commandName}: ${e.message}`);
      }
    }

    invariant(
      typeof object === 'object' && object !== null,
      () => `/${path}: target must be an object or array`
    );

    invariant(
      typeof spec === 'object' && spec !== null,
      () => `/${path}: spec must be an object or a command`
    );

    const nextPath = path ? `${path}/` : '';
    const diffEntries = Object.keys(spec).map((key) => [key, this.update(
      initial[key],
      spec[key],
      { path: `${nextPath}${key}`, allowUnset: true }
    )]);
    return this.applyMerge(initial, diffEntries, path);
  }

  applyMerge(initial, diffEntries, path = '') {
    let updated = null;
    const deleted = [];
    const checkKey = makeKeyChecker(initial, path);
    diffEntries.forEach(([key, newValue]) => {
      checkKey(key);
      const newExist = newValue !== UNSET_TOKEN;

      if (
        (newExist && initial[key] !== newValue) ||
        newExist !== Object.prototype.hasOwnProperty.call(initial, key)
      ) {
        updated = updated || this.copy(initial);
        if (newExist) {
          if (key === '__proto__') {
            Object.defineProperty(updated, key, {
              value: newValue,
              enumerable: true,
              writable: true,
            });
          } else {
            updated[key] = newValue;
          }
        } else if (Array.isArray(updated)) {
          deleted.push(Number(key));
        } else {
          delete updated[key];
        }
      }
    });
    if (deleted.length > 0) {
      deleteIndices(updated, deleted);
    }
    return updated || initial;
  }

  combine(specs, no) {
    invariant(!no, 'combine(): must provide a single (list) parameter.');
    return specs.reduce(combineSpecs, {});
  }

  makeConditionPredicate(condition) {
    if (!Array.isArray(condition)) {
      return conditionPartPredicate(condition, this);
    }

    invariant(condition.length > 0, 'update(): empty condition.');

    if (typeof condition[0] === 'string' && condition.length === 2) {
      return conditionPartPredicate({
        key: condition[0],
        equals: condition[1],
      }, this);
    }

    const parts = condition.map((x) => conditionPartPredicate(x, this));
    return (o) => parts.every((part) => part(o));
  }

  incLoopNesting(iterations, fn) {
    if (iterations <= 1) {
      return fn();
    }

    const oldBreadth = this.nestBreadth;
    ++this.nestDepth;
    this.nestBreadth *= iterations;

    invariant(
      this.nestDepth < MAX_RECURSION_DEPTH &&
      this.nestBreadth < MAX_RECURSION_BREADTH,
      `too much recursion: ${this.nestDepth} deep, ~${this.nestBreadth} items`
    );

    try {
      return fn();
    } finally {
      --this.nestDepth;
      this.nestBreadth = oldBreadth;
    }
  }
}

const defaultContext = new JsonContext();

Object.defineProperty(exports, '__esModule', { value: true });

exports.Context = JsonContext;
exports.update = defaultContext.update;
exports.combine = defaultContext.combine;
exports.invariant = invariant;
exports.UNSET_TOKEN = UNSET_TOKEN;
exports.default = defaultContext;

module.exports = Object.assign(exports.default, { Context: JsonContext });
exports.default.default = module.exports;
