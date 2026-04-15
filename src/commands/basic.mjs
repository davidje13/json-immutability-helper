import config from './util/commandTypeCheck.mjs';

const commands = {
  '=': config('*', 'value')((object, [value]) => value),

  unset: config('*')((object, options, context) => context.UNSET_TOKEN),

  init: config('*', 'value')((object, [value]) => (object === undefined ? value : object)),

  if: config(
    '*',
    'condition',
    'spec',
    'spec?',
  )((object, [condition, spec, elseSpec = null], context) => {
    const check = context.makeConditionPredicate(condition);
    if (!check(object)) {
      if (!elseSpec) {
        return object;
      }
      return context.update(object, elseSpec, { allowUnset: true });
    }
    return context.update(object, spec, { allowUnset: true });
  }),

  seq: config(
    '*',
    'spec...',
  )((object, specs, context) =>
    specs.reduce((o, spec) => context.update(o, spec, { allowUnset: true }), object),
  ),

  '~': config('boolean')((object) => !object),

  merge: config(
    'object?',
    'merge:object',
    'initial:object?',
  )((object, [value, init], context) => {
    const initedObject = object === undefined ? init : object;
    return context.applyMerge(
      initedObject,
      Object.entries(value).filter(([, v]) => v !== undefined),
    );
  }),

  '+': config('number', 'number')((object, [value]) => object + value),

  '-': config('number', 'number')((object, [value]) => object - value),
};

const optAdd = (v) => (v === 0 ? null : v < 0 ? ['-', -v] : ['+', v]);

const optimisations = {
  '~': () => null,
  merge: (spec1, spec2) => {
    const output = ['merge', { ...spec1[1], ...spec2[1] }];
    if (spec1[2] !== undefined) {
      output.push(spec1[2]);
    }
    return output;
  },
  '+': (spec1, spec2) => optAdd(spec1[1] + spec2[1]),
  '+,-': (spec1, spec2) => optAdd(spec1[1] - spec2[1]),
  '-,+': (spec1, spec2) => optAdd(spec2[1] - spec1[1]),
  '-': (spec1, spec2) => optAdd(-spec1[1] - spec2[1]),
};

export default { commands, optimisations };
