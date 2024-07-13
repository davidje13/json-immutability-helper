import config from './util/commandTypeCheck.mjs';

const commands = {
  set: config('*', 'value')((object, [value]) => value),

  unset: config('*')((object, options, context) => context.UNSET_TOKEN),

  init: config('*', 'value')((object, [value]) => (object === undefined ? value : object)),

  updateIf: config(
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

  toggle: config('boolean')((object) => !object),

  merge: config(
    'object?',
    'merge:object',
    'initial:object?',
  )((object, [value, init], context) => {
    const initedObject = object === undefined ? init : object;
    return context.applyMerge(initedObject, Object.entries(value));
  }),

  add: config('number', 'number')((object, [value]) => object + value),

  subtract: config('number', 'number')((object, [value]) => object - value),
};

// Aliases
commands.if = commands.updateIf;
commands['='] = commands.set;
commands['+'] = commands.add;
commands['-'] = commands.subtract;
commands['~'] = commands.toggle;

export default { commands };
