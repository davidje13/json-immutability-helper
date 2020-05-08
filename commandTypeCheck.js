function typeChecker(type) {
  switch (type) {
  case '*':
  case 'value': return () => true;
  case 'array': return Array.isArray;
  case 'condition': return (o) => typeof o === 'object';
  case 'spec': return (o) => typeof o === 'object';
  default: return (o) => typeof o === type;
  }
}

function parseType(type) {
  const sep = type.indexOf(':');
  const name = sep === -1 ? type : type.substr(0, sep);
  const str = sep === -1 ? type : type.substr(sep + 1);

  if (str.endsWith('...')) {
    return {
      variadic: true,
      optional: true,
      check: typeChecker(str.substr(0, str.length - 3)),
      name,
    };
  }
  if (str.endsWith('?')) {
    return {
      variadic: false,
      optional: true,
      check: typeChecker(str.substr(0, str.length - 1)),
      name,
    };
  }

  return {
    variadic: false,
    optional: false,
    check: typeChecker(str),
    name,
  };
}

module.exports = (targetType, ...types) => {
  const pTarget = parseType(targetType);
  const pTypes = types.map(parseType);
  const argNames = ['command', ...pTypes.map((t) => t.name)];
  const targetMsg = `expected target to be ${pTarget.name}`;
  const msg = `expected [${argNames.join(', ')}]`;
  const minLen = pTypes.filter((t) => !t.optional).length;
  const maxLen = pTypes.some((t) => t.variadic) ?
    Number.POSITIVE_INFINITY : pTypes.length;

  return (fn) => (object, args, context) => {
    context.invariant(pTarget.check(object), targetMsg);
    context.invariant(args.length >= minLen && args.length <= maxLen, msg);
    for (let i = 0; i < args.length; ++i) {
      const { variadic, check } = pTypes[i];
      context.invariant(check(args[i]), msg);
      if (variadic) {
        for (++i; i < args.length; ++i) {
          context.invariant(check(args[i]), msg);
        }
      }
    }
    return fn(object, args, context);
  };
};
