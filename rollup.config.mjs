import terser from '@rollup/plugin-terser';

const sources = {
  'commands/list': 'src/commands/list.mjs',
  'commands/math': 'src/commands/math.mjs',
  'commands/string': 'src/commands/string.mjs',
  'helpers/hooks': 'src/helpers/hooks.mjs',
  'helpers/scoped': 'src/helpers/scoped.mjs',
};

const plugins = [
  terser({
    format: { ascii_only: true },
    mangle: { properties: { regex: /^_/ } },
  }),
];

export default [
  {
    input: { index: 'src/index.mjs', ...sources },
    output: {
      dir: 'build',
      format: 'esm',
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name]-[hash].mjs',
    },
    plugins,
  },
  {
    input: { index: 'src/index-cjs.mjs', ...sources },
    output: {
      dir: 'build',
      format: 'cjs',
      entryFileNames: '[name].js',
      chunkFileNames: '[name]-[hash].js',
    },
    plugins,
  },
];
