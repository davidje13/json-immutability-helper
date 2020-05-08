const defaultConditions = require('./conditions');
const { defaultCommands, riskyStringCommands } = require('./commands');

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

    let updated = null;
    const deleted = [];
    const nextPath = path ? `${path}/` : '';
    Object.keys(spec).forEach((key) => {
      const updateOptions = { path: `${nextPath}${key}`, allowUnset: true };

      const oldValue = initial[key];
      const newValue = this.update(oldValue, spec[key], updateOptions);
      const newExist = newValue !== UNSET_TOKEN;

      if (
        (newExist && oldValue !== newValue) ||
        newExist !== Object.prototype.hasOwnProperty.call(initial, key)
      ) {
        updated = updated || this.copy(initial);
        if (newExist) {
          updated[key] = newValue;
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
    if (Array.isArray(condition)) {
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
    return conditionPartPredicate(condition, this);
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
