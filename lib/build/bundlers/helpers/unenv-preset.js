import { getAbsoluteLibDirPath } from '#utils';

const nextNodePresetPath = `${getAbsoluteLibDirPath()}/presets/next/node`;
const bundlerPolyfillsPath = `${getAbsoluteLibDirPath()}/build/bundlers/polyfills`;

export default {
  inject: {
    __dirname: `${bundlerPolyfillsPath}/node/globals/path-dirname.js`,
    __filename: `${bundlerPolyfillsPath}/node/globals/path-filename.js`,
  },
  alias: {
    'azion/utils': 'azion/utils',
    '@fastly/http-compute-js': '@fastly/http-compute-js',
    'next/dist/compiled/etag': `${nextNodePresetPath}/custom-server/12.3.x/util/etag.js`,
    accepts: 'accepts',
    querystring: 'querystring-es3/index.js',
  },
  external: ['node:async_hooks', 'node:fs/promises'],
  polyfill: [
    'aziondev:async_hooks:/async-hooks/async-hooks.polyfills.js',
    'aziondev:fs:/fs/fs.polyfills.js',
    'aziondev:fs/promises:/fs/promises/promises.polyfills.js',
    `azionprd:fs:/fs.js`,
  ],
};
