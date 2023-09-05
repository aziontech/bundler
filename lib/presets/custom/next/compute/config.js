// import path from 'path';
import webpack from 'webpack';

import { createRequire } from 'module';

import { getAbsoluteLibDirPath, generateWebpackBanner } from '#utils';

const require = createRequire(import.meta.url);
const libDirPath = getAbsoluteLibDirPath();
const nodePolyfillsPath = `${libDirPath}/build/polyfills/node`;
const nextNodePresetPath = `${libDirPath}/presets/custom/next/compute/node`;

/**
 * Config to be used in build context.
 */
const config = {
  builder: 'webpack',
  useNodePolyfills: false,
  custom: {
    experiments: {
      topLevelAwait: true,
    },
    optimization: {
      minimize: true,
    },
    module: {
      // Asset modules are modules that allow the use asset files (fonts, icons, etc)
      // without additional configuration or dependencies.
      rules: [
        // asset/source exports the source code of the asset.
        // Usage: e.g., import notFoundPage from "./page_404.html"
        {
          test: /\.(txt|html)/,
          type: 'asset/source',
        },
      ],
    },
    plugins: [
      // Polyfills go here.
      // Used for, e.g., any cross-platform WHATWG,
      // or core nodejs modules needed for your application.
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process',
      }),
      new webpack.BannerPlugin({
        banner: generateWebpackBanner([`${nodePolyfillsPath}/globals/navigator.js`, `${nodePolyfillsPath}/globals/performance.js`]),
        raw: true,
      }),
      new webpack.EnvironmentPlugin({
        NEXT_RUNTIME: 'edge',
        NEXT_COMPUTE_JS: true,
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
    resolve: {
      mainFields: ['browser', 'main', 'module'],
      alias: {
        'next/dist/compiled/raw-body': require.resolve('raw-body'),
        util: require.resolve('util/'),
      },
      fallback: {
        async_hooks: false,
        tls: false,
        net: false,
        fs: false,
        http: require.resolve('stream-http'),
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify/'),
        events: require.resolve('events/'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
        querystring: require.resolve('querystring-es3'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url/'),
        util: require.resolve('util/'),
        zlib: require.resolve('browserify-zlib'),
        dns: `${nodePolyfillsPath}/dns.js`,
        http2: `${nodePolyfillsPath}/http2.js`,
        'next/dist/compiled/etag': `${nextNodePresetPath}/custom-server/12.3.1/util/etag.js`,
        '@fastly/http-compute-js': require.resolve('@fastly/http-compute-js'),
        accepts: require.resolve('accepts'),
      },
    },
  },
};

export default config;
