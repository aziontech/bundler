import { getAbsoluteLibDirPath } from '#utils';

const libDirPath = getAbsoluteLibDirPath();

const externalPolyfillsPath = `${libDirPath}/env/polyfills`;

export default {
  libs: new Map(),
  globals: new Map(),
  alias: new Map(),
  external: new Map([
    [
      'azion:storage',
      `${externalPolyfillsPath}/azion/storage/storage.polyfills.js`,
    ],
    [
      'Azion.env',
      `${externalPolyfillsPath}/azion/env-vars/env-vars.polyfills.js`,
    ],
    [
      'Azion.networkList',
      `${externalPolyfillsPath}/azion/network-list/network-list.polyfills.js`,
    ],
  ]),
};
