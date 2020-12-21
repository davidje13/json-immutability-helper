import module from './index.js';

/* Node 14.13.0+ supports named import heuristics for CJS files
 * (see https://github.com/nodejs/node/pull/35249)
 * But older versions and other tools do not, so we provide a
 * .mjs wrapper for convenience.
 */

export default module.default;
export const { context, update, combine, invariant, UNSET_TOKEN } = module;
