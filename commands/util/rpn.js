const config = require('./commandTypeCheck');

const CONSTANTS = {
  e: Math.E,
  pi: Math.PI,
  Inf: Number.POSITIVE_INFINITY,
  NaN: Number.NaN,
};

const rpn = (functionsObj, constants) => {
  const functions = new Map([...Object.entries(functionsObj)]);

  function applyFunction(token, stack, context) {
    const [funcName, arityStr] = token.split(':');
    if (!functions.has(funcName)) {
      throw new Error(`unknown function ${funcName}`);
    }
    const [minArity, maxArity, fn] = functions.get(funcName);
    const arity = arityStr ? Number.parseInt(arityStr, 10) : minArity;
    if (arity < minArity || arity > maxArity) {
      throw new Error(`invalid arity for ${token}`);
    }
    if (stack.length < arity) {
      throw new Error(`argument mismatch for ${token}`);
    }
    stack.push(fn.apply(context, stack.splice(-arity)));
  }

  return (tokens, values, context) => {
    const stack = [];
    const vars = Object.assign({}, constants, values);
    tokens.forEach((token) => {
      if (typeof token === 'number') {
        stack.push(token);
      } else if (typeof token !== 'string') {
        throw new Error('unexpected token type');
      } else if (token.charAt(0) === '"') {
        stack.push(JSON.parse(token));
      } else if (Object.prototype.hasOwnProperty.call(vars, token)) {
        stack.push(vars[token]);
      } else {
        applyFunction(token, stack, context);
      }
    });
    if (stack.length !== 1) {
      throw new Error('argument mismatch');
    }
    return stack[0];
  };
};

function makeRpnCommand(inputType, funcs) {
  const execRpn = rpn(funcs, CONSTANTS);
  return config(inputType, 'operations:primitive...')((
    object,
    tokens,
    context
  ) => {
    const result = execRpn(tokens, { x: object }, context);
    context.invariant(
      typeof object === typeof result,
      'cannot change type of property'
    );
    return result;
  });
}

module.exports = {
  rpn,
  makeRpnCommand,
};
