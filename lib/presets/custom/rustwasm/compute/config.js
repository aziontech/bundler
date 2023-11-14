import webpack from 'webpack';

/**
 * Config to be used in build context.
 */
const config = {
  builder: 'webpack',
  useNodePolyfills: false,
  custom: {
    optimization: {
        minimize: true,
    },
    performance: {
      maxEntrypointSize: 2097152,
      maxAssetSize: 2097152
    },
    module: {
      rules: [
          {
              test: /\.wasm$/,
              type: "asset/inline",
          },
      ],
    },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      })
    ]
  },
};

export default config;
