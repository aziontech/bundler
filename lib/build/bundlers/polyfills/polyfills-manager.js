import { getAbsoluteLibDirPath } from '#utils';

const libDirPath = getAbsoluteLibDirPath();

/**
 * External polyfills are resolved in the build, but as they are for the local
 * environment (Vulcan dev) they are located in #env/polyfills.
 */
const externalPolyfillsPath = `${libDirPath}/env/polyfills`;

/**
 * Manages and builds polyfills for Node and global browser environments.
 */
class PolyfillsManager {
  /**
   * Constructs a PolyfillsManager instance.
   */
  constructor() {
    /** @type {Map<string, string>} */
    this.globals = new Map();
    /** @type {Map<string, string|boolean>} */
    this.libs = new Map();
    /** @type {Map<string, string|boolean>} */
    this.alias = new Map();
    /** @type {Map<string, string|boolean>} */
    this.external = new Map();
  }

  /**
   * Sets a global polyfill.
   * @param {string} name - Name of the global.
   * @param {string} path - Path to the polyfill.
   */
  setGlobal(name, path) {
    this.globals.set(name, path);
  }

  /**
   * Sets a module/library polyfill.
   * @param {string} name - Name of the module/library.
   * @param {string|boolean} path - Path to the polyfill or a boolean value.
   */
  setLib(name, path) {
    this.libs.set(name, path);
  }

  /**
   * Sets a module/alias polyfill.
   * @param {string} name - Name of the module/alias.
   * @param {string|boolean} path - Path to the polyfill or a boolean value.
   */
  setAlias(name, path) {
    this.alias.set(name, path);
  }

  /**
   * Sets a external libs.
   * @param {string} name - Name of the external.
   * @param {string|boolean} path - Path to the polyfill or a boolean value.
   */
  setExternal(name, path) {
    this.external.set(name, path);
  }

  /**
   * Builds and retrieves the polyfills for Node and globals.
   * @returns {{ libs: Map<string, string|boolean>, globals: Map<string, string>, alias: Map<string, string>, external: Map<string, string> }} - Object containing libs and globals.
   */
  buildPolyfills() {
    this.setExternal(
      'azion:storage',
      `${externalPolyfillsPath}/azion/storage/storage.polyfills.js`,
    );

    // globalThis.Azion
    this.setExternal(
      'Azion.env',
      `${externalPolyfillsPath}/azion/env-vars/env-vars.polyfills.js`,
    );
    this.setExternal(
      'Azion.networkList',
      `${externalPolyfillsPath}/azion/network-list/network-list.polyfills.js`,
    );

    return {
      libs: this.libs,
      globals: this.globals,
      alias: this.alias,
      external: this.external,
    };
  }
}

export default PolyfillsManager;
