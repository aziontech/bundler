/**
 * Config to be used in build context.
 */
const config = {
  builder: 'esbuild',
  useNodePolyfills: false,
  custom: {
    config: {},
    plugins: [],
  },
};

export default config;
