module.exports = {
  equals: (c) => (v) => (v === c),
  not: (c) => (v) => (v !== c),
  greaterThan: (c) => (v) => (v > c),
  lessThan: (c) => (v) => (v < c),
  greaterThanOrEqual: (c) => (v) => (v >= c),
  lessThanOrEqual: (c) => (v) => (v <= c),
};
