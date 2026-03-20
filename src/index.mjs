import basicCommands from './commands/basic.mjs';
import basicConditions from './conditions/basic.mjs';

export function invariant(condition, msgFn) {
  if (!condition) {
    const msg = typeof msgFn === 'function' ? msgFn() : msgFn || 'bad input';
    throw new Error(msg);
  }
}

const safeGet = (o, key) => (Object.prototype.hasOwnProperty.call(o, key) ? o[key] : undefined);

const addProperty = (o, key, value) =>
  Object.defineProperty(o, key, {
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  });

const isOp = Array.isArray;
const isArrayIndex = (key, limit) => {
  const v = Number(key);
  return v >= 0 && v < limit && v.toFixed(0) === key;
};

function getSeqSteps(spec) {
  if (isOp(spec) && spec[0] === 'seq') {
    return spec.slice(1);
  }
  return [spec];
}

function mergeSplice(first, second) {
  const offset = second[0] - first[0];
  const posOffset = Math.max(offset, 0);
  const del = Math.max(Math.min(second[1] + offset, first.length - 2) - posOffset, 0);
  const r = [...first];
  r.splice(2 + posOffset, del, ...second.slice(2));
  r[0] = second[0] - posOffset;
  r[1] += second[1] - del;
  return r;
}

function findFirstIndexBin(l, pred, p1 = 0, p2 = l.length) {
  if (p2 > p1 && !pred(l[p2 - 1])) {
    // optimisation: if simplifySplice list is already ordered, traverse it in O(n) instead of O(n log(n))
    return p2;
  } else {
    --p2;
  }
  while (p2 > p1) {
    const p = (p1 + p2) >>> 1;
    if (pred(l[p])) {
      p2 = p;
    } else {
      p1 = p + 1;
    }
  }
  return p1;
}

export function simplifySplice(...stages) {
  let neg = false;
  let begin = 0;
  const ranges = [];
  if (typeof stages[0]?.[0] === 'string') {
    ranges.push(stages[0][0]);
    begin = 1;
  }
  for (const l of stages) {
    for (const stage of l) {
      if (typeof stage !== 'string' && (stage.length > 2 || stage[1])) {
        const pos = stage[0];
        const curNeg = pos < 0;
        if (curNeg !== neg) {
          begin = ranges.length;
          neg = curNeg;
        }
        const p1 = findFirstIndexBin(ranges, (r) => pos <= r[0] + r.length - 2, begin);
        if (p1 === ranges.length) {
          ranges.push(stage);
        } else {
          const end = pos + stage[1];
          const p2 = findFirstIndexBin(ranges, (r) => r[0] > end, p1);
          const shift = stage.length - 2 - stage[1];
          if (shift) {
            for (let i = p2; i < ranges.length; ++i) {
              ranges[i][0] += shift;
            }
          }
          if (p2 === p1) {
            ranges.splice(p1, 0, stage);
          } else {
            const r1 = ranges[p1];
            let merged = mergeSplice(r1, stage);
            for (let i = p1 + 1; i < p2; ++i) {
              merged = mergeSplice(merged, ranges[i]);
            }
            if (merged.length > 2 || merged[1]) {
              ranges.splice(p1, p2 - p1, merged);
            } else {
              ranges.splice(p1, p2 - p1);
            }
          }
        }
      }
    }
  }
  return ranges;
}

function combineSpecs(spec1, spec2) {
  if (isOp(spec1) || isOp(spec2)) {
    if (isOp(spec1) && spec1[0] === 'splice' && isOp(spec2) && spec2[0] === 'splice') {
      return simplifySplice(spec1, spec2);
    }
    const a = getSeqSteps(spec1);
    const b = getSeqSteps(spec2);
    if (a.length && b.length && a.length + b.length > 2) {
      const aa = a.pop();
      const bb = b.shift();
      return ['seq', ...a, ...getSeqSteps(combineSpecs(aa, bb)), ...b];
    }
    return ['seq', ...a, ...b];
  }

  const result = { ...spec1 };
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
    return specs.length > 0 ? specs.reduce(combineSpecs) : {};
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
