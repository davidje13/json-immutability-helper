import basicCommands from './commands/basic.mjs';
import basicConditions from './conditions/basic.mjs';
import { combineSpecs } from './combine.mjs';
import { addProperty, isArrayIndex, isOp, safeGet } from './util.mjs';

export function invariant(condition, msgFn) {
  if (!condition) {
    const msg = typeof msgFn === 'function' ? msgFn() : msgFn || 'bad input';
    throw new Error(msg);
  }
}

function deleteIndices(arr, indices) {
  indices.sort((a, b) => a - b);
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

export const UNSET_TOKEN = Symbol('unset');

function bindAll(o, fns) {
  fns.forEach((fn) => {
    o[fn] = o[fn].bind(o);
  });
}

class JsonContext {
  constructor(options) {
    Object.assign(this, options, {
      commands: new Map(options.commands),
      conditions: new Map(options.conditions),
      optimisations: new Map(options.optimisations),
      optSeq: new Set(options.optSeq),
      _nestDepth: 0,
      _nestBreadth: 1,
      UNSET_TOKEN,
      invariant,
    });

    bindAll(this, ['with', 'update', 'applyMerge', 'combine', 'makeConditionPredicate']);

    Object.assign(this.update, {
      context: this,
      combine: this.combine,
      isNoOp: this.isNoOp,
      UNSET_TOKEN: this.UNSET_TOKEN,
      with: (...extensions) => this.with(...extensions).update,
    });
  }

  with(...overrides) {
    const base = {
      commands: [...this.commands.entries()],
      conditions: [...this.conditions.entries()],
      optimisations: [...this.optimisations.entries()],
      optSeq: [...this.optSeq],
      limits: { ...this.limits },
      rpnOperators: { ...this.rpnOperators },
      rpnConstants: { ...this.rpnConstants },
      isEquals: this.isEquals,
      copy: this.copy,
    };
    return new JsonContext(
      overrides.reduce(
        (v, cur) =>
          Object.assign(v, cur, {
            commands: [...v.commands, ...Object.entries(cur.commands || {})],
            conditions: [...v.conditions, ...Object.entries(cur.conditions || {})],
            optimisations: [...v.optimisations, ...Object.entries(cur.optimisations || {})],
            optSeq: cur.optimiseSequence ? [...v.optSeq, cur.optimiseSequence] : v.optSeq,
            limits: Object.assign(v.limits, cur.limits),
            rpnOperators: Object.assign(v.rpnOperators, cur.rpnOperators),
            rpnConstants: Object.assign(v.rpnConstants, cur.rpnConstants),
          }),
        base,
      ),
    );
  }

  update(object, spec, { path = '', allowUnset = false } = {}) {
    const initial = object === UNSET_TOKEN ? undefined : object;

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
      `/${path}: target must be an object or array`,
    );

    invariant(
      typeof spec === 'object' && spec !== null,
      `/${path}: spec must be an object or a command`,
    );

    const nextPath = path ? `${path}/` : '';
    const diffEntries = Object.entries(spec).map(([key, s]) => [
      key,
      this.update(safeGet(initial, key), s, {
        path: `${nextPath}${key}`,
        allowUnset: true,
      }),
    ]);
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

      if (newExist !== oldExist || (newExist && !this.isEquals(initial[key], newValue))) {
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
    const meaningfulSpecs = specs.filter((s) => !this.isNoOp(s));
    return meaningfulSpecs.length > 0
      ? (meaningfulSpecs.reduce(combineSpecs.bind(null, this, false)) ?? {})
      : {};
  }

  isNoOp(spec) {
    if (!spec || typeof spec !== 'object') {
      return false;
    }
    if (isOp(spec)) {
      return spec[0] === 'seq' && spec.length === 1;
    }
    for (const key in spec) {
      if (Object.prototype.hasOwnProperty.call(spec, key)) {
        return false;
      }
    }
    return true;
  }

  makeConditionPredicate(cond) {
    invariant(typeof cond === 'object' && cond, 'invalid condition');

    if (Array.isArray(cond)) {
      const [key, ...options] = cond;
      const type = this.conditions.get(key);
      invariant(type, `unknown condition type: ${key}`);
      return type(options, this);
    }

    const predicates = Object.entries(cond).map(([key, subCond]) => {
      const predicate = this.makeConditionPredicate(subCond);
      return (o) => predicate(typeof o === 'object' && o ? safeGet(o, key) : undefined);
    });
    return (o) => predicates.every((p) => p(o));
  }

  incLoopNesting(iterations, fn) {
    if (iterations <= 1) {
      return fn();
    }

    const oldBreadth = this._nestBreadth;
    ++this._nestDepth;
    this._nestBreadth *= iterations;

    try {
      invariant(
        this._nestDepth < this.limits.recursionDepth &&
          this._nestBreadth < this.limits.recursionBreadth,
        `too much recursion: ${this._nestDepth} deep, ~${this._nestBreadth} items`,
      );

      return fn();
    } finally {
      --this._nestDepth;
      this._nestBreadth = oldBreadth;
    }
  }
}

const BASE_CONFIG = {
  commands: [],
  conditions: [],
  optimisations: [],
  optSeq: [],
  limits: {
    stringLength: 10240,
    recursionDepth: 10,
    recursionBreadth: 100000,
  },
  rpnOperators: {},
  rpnConstants: {},
  isEquals: Object.is,
  copy: (o) => (Array.isArray(o) ? [...o] : typeof o === 'object' && o ? { ...o } : o),
};

export const context = new JsonContext(BASE_CONFIG).with(basicCommands, basicConditions);
export const combine = context.combine;
export const isNoOp = context.isNoOp;
export const update = context.update;
export default context;
