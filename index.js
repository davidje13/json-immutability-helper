const { basicCommands } = require('./commands/basic');
const { basicConditions } = require('./conditions/basic');

function invariant(condition, msgFn) {
  if (!condition) {
    const msg = typeof msgFn === 'function' ? msgFn() : msgFn || 'bad input';
    throw new Error(msg);
  }
}

const safeGet = (o, key) => (
  Object.prototype.hasOwnProperty.call(o, key) ? o[key] : undefined
);

const addProperty = (o, key, value) => Object.defineProperty(o, key, {
  value,
  configurable: true,
  enumerable: true,
  writable: true,
});

const isOp = Array.isArray;
const isArrayIndex = (key, limit) => {
  const v = Number(key);
  return (v >= 0 && v < limit && v.toFixed(0) === key);
};

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
  Object.entries(spec2).forEach(([key, value2]) => {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = combineSpecs(result[key], value2);
    } else if (result[key] === undefined) {
      result[key] = value2;
    } else {
      addProperty(result, key, value2);
    }
  });
  return result;
}

function conditionPartPredicate(condition, context) {
  invariant(
    typeof condition === 'object',
    () => `expected spec of condition to be an object; got ${condition}`
  );

  const checks = Object.entries(condition)
    .filter(([key]) => (key !== 'key'))
    .map(([key, param]) => {
      const type = context.conditions.get(key);
      invariant(type, () => `unknown condition type: ${key}`);
      return type(param);
    });

  if (condition.key === undefined) {
    invariant(checks.length > 0, () => `unknown condition ${condition}`);
    return (o) => checks.every((c) => c(o));
  }

  if (!checks.length) {
    checks.push(basicConditions.conditions.notNullish());
  }
  return (o) => {
    const v = safeGet(o, condition.key);
    return checks.every((c) => c(v));
  };
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
  constructor({ commands, conditions, limits, isEquals, copy }) {
    Object.assign(this, {
      commands: new Map(commands),
      conditions: new Map(conditions),
      limits,
      isEquals,
      copy,
      nestDepth: 0,
      nestBreadth: 1,
      UNSET_TOKEN,
      invariant,
    });

    bindAll(this, [
      'with',
      'update',
      'applyMerge',
      'combine',
      'makeConditionPredicate',
    ]);

    Object.assign(this.update, {
      context: this,
      combine: this.combine,
      UNSET_TOKEN: this.UNSET_TOKEN,
      with: (...extensions) => this.with(...extensions).update,
    });
  }

  with(...overrides) {
    const base = {
      commands: [...this.commands.entries()],
      conditions: [...this.conditions.entries()],
      limits: Object.assign({}, this.limits),
      isEquals: this.isEquals,
      copy: this.copy,
    };
    return new JsonContext(overrides.reduce((v, cur) => Object.assign(v, cur, {
      commands: [...v.commands, ...Object.entries(cur.commands || {})],
      conditions: [...v.conditions, ...Object.entries(cur.conditions || {})],
      limits: Object.assign(v.limits, cur.limits),
    }), base));
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
    const diffEntries = Object.entries(spec).map(
      ([key, s]) => [key, this.update(safeGet(initial, key), s, {
        path: `${nextPath}${key}`,
        allowUnset: true,
      })]
    );
    return this.applyMerge(initial, diffEntries, path);
  }

  applyMerge(initial, diffEntries, path = '') {
    let updated = null;
    const deleted = [];
    const array = Array.isArray(initial);
    diffEntries.forEach(([key, newValue]) => {
      if (array && !isArrayIndex(key, initial.length)) {
        throw new Error(`/${path}: cannot modify array property ${key}`);
      }

      const newExist = newValue !== UNSET_TOKEN;
      const oldExist = Object.prototype.hasOwnProperty.call(initial, key);

      if (newExist !== oldExist || (newExist && initial[key] !== newValue)) {
        updated = updated || this.copy(initial);
        if (newExist) {
          if (!oldExist && initial[key] !== undefined) {
            addProperty(updated, key, newValue);
          } else {
            updated[key] = newValue;
          }
        } else if (array) {
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

  makeConditionPredicate(cond) {
    if (!Array.isArray(cond)) {
      return conditionPartPredicate(cond, this);
    }

    invariant(cond.length > 0, 'update(): empty condition.');

    if (typeof cond[0] === 'string' && cond.length === 2) {
      return conditionPartPredicate({ key: cond[0], equals: cond[1] }, this);
    }

    const parts = cond.map((x) => conditionPartPredicate(x, this));
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
      this.nestDepth < this.limits.recursionDepth &&
      this.nestBreadth < this.limits.recursionBreadth,
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

const BASE_CONFIG = {
  commands: [],
  conditions: [],
  limits: {
    stringLength: 10240,
    recursionDepth: 10,
    recursionBreadth: 100000,
  },
  isEquals: (x, y) => (x === y),
  copy: (o) => (
    Array.isArray(o) ? [...o] :
      (typeof o === 'object' && o) ? Object.assign({}, o) :
        o
  ),
};

const defaultContext = new JsonContext(BASE_CONFIG)
  .with(basicCommands, basicConditions);

Object.defineProperty(exports, '__esModule', { value: true });

exports.context = defaultContext;
exports.update = defaultContext.update;
exports.combine = defaultContext.combine;
exports.invariant = invariant;
exports.UNSET_TOKEN = UNSET_TOKEN;
exports.default = defaultContext;

module.exports = Object.assign(exports.default, { context: defaultContext });
exports.default.default = module.exports;
