/**
 * Config to be used in build context.
 */
const config = {
  builder: 'webpack',
  webpack: {
    config: {
      distDir: '.edge/statics',
    },
    plugins: [],
  },
};

export default config;
