const conditions = {
  equals: (c) => (v) => v === c,
  not: (c) => (v) => v !== c,
  greaterThan: (c) => (v) => v > c,
  lessThan: (c) => (v) => v < c,
  greaterThanOrEqual: (c) => (v) => v >= c,
  lessThanOrEqual: (c) => (v) => v <= c,
  /* eslint-disable-next-line no-eq-null,eqeqeq */ // Intentional nullish check
  notNullish: () => (v) => v != null,
};

const basicConditions = { conditions };
module.exports = basicConditions;
