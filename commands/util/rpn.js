const config = require('./commandTypeCheck');

const rpn = (functionsObj, constants, context) => {
  const functions = new Map([...Object.entries(functionsObj)]);

  function applyFunction(token, stack) {
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

  return (tokens, values) => {
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
        applyFunction(token, stack);
      }
    });
    if (stack.length !== 1) {
      throw new Error('argument mismatch');
    }
    return stack[0];
  };
};

const COMPILED_RPN = Symbol('compiled-rpn');

const rpnCommand = config(
  'primitive',
  'operations:primitive...',
)((object, tokens, context) => {
  let compiledRpn = context[COMPILED_RPN];
  if (!compiledRpn) {
    compiledRpn = rpn(context.rpnOperators, context.rpnConstants, context);
    context[COMPILED_RPN] = compiledRpn;
  }
  const result = compiledRpn(tokens, { x: object });
  context.invariant(typeof object === typeof result, 'cannot change type of property');
  return result;
});

module.exports = {
  rpn,
  rpnCommand,
};
