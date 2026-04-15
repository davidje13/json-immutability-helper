import { addProperty, isOp } from './util.mjs';

export function combineSpecs(context, inner, spec1, spec2) {
  if (isOp(spec1) && isOp(spec2)) {
    const op1 = spec1[0];
    const op2 = spec2[0];
    const opt = context.optimisations.get(op1 === op2 ? op1 : `${op1},${op2}`);
    if (opt) {
      return opt(spec1, spec2);
    }
  }

  if (isOp(spec1) || isOp(spec2)) {
    const a = getSeqSteps(spec1);
    const b = getSeqSteps(spec2);
    const aN = a[a.length - 1];
    if (isOp(aN) && ['=', 'unset'].includes(aN[0])) {
      try {
        const v = context.update(aN[0] === '=' ? aN[1] : undefined, spec2);
        return v === undefined ? ['unset'] : ['=', v];
      } catch {
        // abandon optimisation if update fails
      }
    }
    const b0 = b[0];
    if (isOp(b0)) {
      if (['=', 'unset'].includes(b0[0])) {
        return spec2;
      }
      if (b0[0] === 'init') {
        let knownExists = false;
        for (let i = a.length; i-- > 0; ) {
          const op = a[i];
          if (isOp(op)) {
            if (['=', 'init'].includes(op[0])) {
              knownExists = op[1] !== context.UNSET_TOKEN && op[1] !== undefined;
              break;
            } else if (op[0] === 'merge' && op[2]) {
              knownExists = true;
              break;
            } else if (op[0] === 'unset') {
              break;
            }
          }
        }
        if (knownExists) {
          if (b.length === 1) {
            return spec1;
          }
          if (b.length === 2) {
            return combineSpecs(context, inner, spec1, b[1]);
          }
          b.shift();
        }
      }
    }

    let combined;
    if (!a.length) {
      return ['seq', ...b];
    } else if (!b.length) {
      return ['seq', ...a];
    } else if (a.length + b.length > 2) {
      const aa = a.pop();
      const bb = b.shift();
      combined = [...a, ...getSeqSteps(combineSpecs(context, true, aa, bb)), ...b];
    } else {
      combined = [...a, ...b];
    }
    if (!inner && combined.length > 1) {
      for (const fn of context.optSeq) {
        combined = fn(combined, context, a.length);
      }
    }
    return combined.length > 1 ? ['seq', ...combined] : (combined[0] ?? null);
  }

  const result = { ...spec1 };
  let removed = false;
  Object.entries(spec2).forEach(([key, value2]) => {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const sub = combineSpecs(context, false, result[key], value2);
      if (sub) {
        result[key] = sub;
      } else {
        delete result[key];
        removed = true;
      }
    } else if (result[key] === undefined) {
      result[key] = value2;
    } else {
      addProperty(result, key, value2);
    }
  });
  return removed && Object.keys(result).length === 0 ? null : result;
}

function getSeqSteps(spec) {
  if (!spec) {
    return [];
  }
  if (isOp(spec) && spec[0] === 'seq') {
    return spec.slice(1);
  }
  return [spec];
}
