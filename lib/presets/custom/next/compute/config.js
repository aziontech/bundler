/**
 * Config to be used in build context.
 */
const config = {
  builder: 'esbuild',
  useNodePolyfills: true,
  custom: {
    plugins: [],
  },
};

export default config;
