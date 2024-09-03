const conditions = {
  and: (subConditions, context) => {
    const predicates = subConditions.map((c) => context.makeConditionPredicate(c));
    return (v) => predicates.every((p) => p(v));
  },
  or: (subConditions, context) => {
    const predicates = subConditions.map((c) => context.makeConditionPredicate(c));
    return (v) => predicates.some((p) => p(v));
  },
  not: ([subCondition], context) => {
    const predicate = context.makeConditionPredicate(subCondition);
    return (v) => !predicate(v);
  },
  exists: () => (v) => v !== undefined,
  '=': (options) => (v) => options.includes(v),
  '!=': (options) => (v) => !options.includes(v),
  '~=': (options) => (v) => options.some((o) => o == v),
  '!~=': (options) => (v) => !options.some((o) => o == v),
  '>':
    ([threshold]) =>
    (v) =>
      v > threshold,
  '>=':
    ([threshold]) =>
    (v) =>
      v >= threshold,
  '<':
    ([threshold]) =>
    (v) =>
      v < threshold,
  '<=':
    ([threshold]) =>
    (v) =>
      v <= threshold,
};

export default { conditions };
