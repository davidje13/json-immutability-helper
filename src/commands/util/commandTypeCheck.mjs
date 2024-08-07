const ENUM_REGEX = /^enum\[(.+)\]$/;

function typeChecker(type) {
  switch (type) {
    case '*':
    case 'value':
      return () => true;
    case 'array':
      return Array.isArray;
    case 'condition':
      return (o) => typeof o === 'object';
    case 'single-locator':
      return isLocator(['first', 'last']);
    case 'multi-locator':
      return isLocator(['first', 'last', 'all']);
    case 'spec':
      return (o) => typeof o === 'object';
    case 'primitive':
      return (o) => ['number', 'string'].includes(typeof o);
    default:
      const e = ENUM_REGEX.exec(type);
      if (e) {
        const values = e[1].split(',');
        return (o) => typeof o === 'string' && values.includes(o);
      }
      return (o) => typeof o === type;
  }
}

const isLocator = (types) => (o) => {
  if (Array.isArray(o)) {
    if (o.length !== 2 || typeof o[1] !== 'object') {
      return false;
    }
    o = o[0];
  }
  return (typeof o === 'number' && Math.round(o) === o) || types.includes(o);
};

function parseType(type) {
  let [name, str] = type.split(':');
  str = str || name;
  name = name.replace(/(\.\.\.|\?)$/, '');

  if (str.endsWith('...')) {
    return {
      variadic: true,
      optional: true,
      check: typeChecker(str.slice(0, -3)),
      name,
      suffix: '...',
    };
  }
  if (str.endsWith('?')) {
    return {
      variadic: false,
      optional: true,
      check: typeChecker(str.slice(0, -1)),
      name,
      suffix: '?',
    };
  }

  return {
    variadic: false,
    optional: false,
    check: typeChecker(str),
    name,
    suffix: '',
  };
}

export default (targetType, ...types) => {
  const pTarget = parseType(targetType);
  const pTypes = types.map(parseType);
  const argNames = ['command', ...pTypes.map((t) => t.name + t.suffix)];
  const targetMsg = `expected target to be ${pTarget.name}`;
  const msg = `expected [${argNames.join(', ')}]`;
  const minLen = pTypes.filter((t) => !t.optional).length;
  const maxLen = pTypes.some((t) => t.variadic) ? Number.POSITIVE_INFINITY : pTypes.length;

  return (fn) => (object, args, context) => {
    context.invariant(
      (pTarget.optional && object === undefined) || pTarget.check(object),
      targetMsg,
    );
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
