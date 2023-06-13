import webpack from 'webpack';

/**
 * Config to be used in build context.
 */
const config = {
  builder: 'webpack',
  webpack: {
    config: {},
    plugins: [
      new webpack.DefinePlugin({
        VERSION_ID: JSON.stringify('MY_NEW_VERSION'),
      }),
    ],
  },
};

export default config;
