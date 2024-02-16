import { createRequire } from 'module';
import { getAbsoluteLibDirPath } from '#utils';

const require = createRequire(import.meta.url);
const libDirPath = getAbsoluteLibDirPath();
const polyfillsPath = `${libDirPath}/build/bundlers/polyfills`;
const nextNodePresetPath = `${libDirPath}/presets/custom/next/compute/node`;
const nodePolyfillsPath = `${polyfillsPath}/node`;

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
    // global polyfills
    this.setGlobal('buffer', `${nodePolyfillsPath}/globals/buffer.js`);
    this.setGlobal('console', require.resolve('console-browserify'));
    this.setGlobal('navigator', `${nodePolyfillsPath}/globals/navigator.js`);
    this.setGlobal(
      'performance',
      `${nodePolyfillsPath}/globals/performance.js`,
    );
    this.setGlobal('process', `${nodePolyfillsPath}/globals/process.cjs`);
    this.setGlobal('__dirname', `${nodePolyfillsPath}/globals/path-dirname.js`);
    this.setGlobal(
      '__filename',
      `${nodePolyfillsPath}/globals/path-dirname.js`,
    );
    // libs polyfills (fallbacks)
    this.setLib('accepts', require.resolve('accepts'));
    this.setLib('buffer', require.resolve('buffer/'));
    this.setLib('child_process', `${nodePolyfillsPath}/_empty.js`);
    this.setLib('cluster', `${nodePolyfillsPath}/_empty.js`);
    this.setLib('console', require.resolve('console-browserify'));
    this.setLib('crypto', `${nodePolyfillsPath}/crypto.js`);
    this.setLib('dgram', `${nodePolyfillsPath}/_empty.js`);
    this.setLib('dns', `${nodePolyfillsPath}/dns.js`);
    this.setLib('events', require.resolve('events/'));
    this.setLib('fs', `${nodePolyfillsPath}/fs.js`);
    this.setLib('http', require.resolve('stream-http'));
    this.setLib('http2', `${nodePolyfillsPath}/http2.js`);
    this.setLib('https', require.resolve('stream-http'));
    this.setLib('inspector', `${nodePolyfillsPath}/_empty.js`);
    this.setLib('module', `${nodePolyfillsPath}/module.js`);
    this.setLib('net', `${nodePolyfillsPath}/_empty.js`);
    this.setLib('os', require.resolve('os-browserify/browser'));
    this.setLib('path', require.resolve('path-browserify'));
    this.setLib('perf_hooks', `${nodePolyfillsPath}/_empty.js`);
    this.setLib('process', `${nodePolyfillsPath}/globals/process.cjs`);
    this.setLib('querystring', require.resolve('querystring-es3/'));
    this.setLib('readline', `${nodePolyfillsPath}/_empty.js`);
    this.setLib('repl', `${nodePolyfillsPath}/_empty.js`);
    this.setLib('stream', require.resolve('stream-browserify'));
    this.setLib(
      '_stream_passthrough',
      require.resolve('readable-stream/lib/_stream_passthrough.js'),
    );
    this.setLib(
      '_stream_readable',
      require.resolve('readable-stream/lib/stream.js'),
    );
    this.setLib(
      '_stream_transform',
      require.resolve('readable-stream/lib/_stream_transform.js'),
    );
    this.setLib(
      '_stream_writable',
      require.resolve('readable-stream/lib/_stream_writable.js'),
    );
    this.setLib('string_decoder', require.resolve('string_decoder/'));
    this.setLib('sys', require.resolve('util/util.js'));
    this.setLib('timers', require.resolve('timers-browserify'));
    this.setLib('tls', `${nodePolyfillsPath}/_empty.js`);
    this.setLib('tty', require.resolve('tty-browserify'));
    this.setLib('url', require.resolve('url/'));
    this.setLib('util', require.resolve('util/'));
    this.setLib('vm', require.resolve('vm-browserify'));
    this.setLib('zlib', require.resolve('browserify-zlib'));
    this.setLib(
      'next/dist/compiled/etag',
      `${nextNodePresetPath}/custom-server/12.3.1/util/etag.js`,
    );
    this.setLib(
      '@fastly/http-compute-js',
      require.resolve('@fastly/http-compute-js'),
    );

    // alias polyfills
    this.setAlias('util', require.resolve('util/'));
    this.setAlias('process', `${nodePolyfillsPath}/globals/process.cjs`);

    // external polyfills
    this.setExternal(
      'async_hooks',
      `${externalPolyfillsPath}/async-hooks/async-hooks.polyfills.js`,
    );
    this.setExternal(
      'azion:storage',
      `${externalPolyfillsPath}/azion/storage/storage.polyfills.js`,
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
