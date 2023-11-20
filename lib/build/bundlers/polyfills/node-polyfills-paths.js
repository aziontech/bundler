import { createRequire } from 'module';
import { getAbsoluteLibDirPath } from '#utils';

const require = createRequire(import.meta.url);
const libDirPath = getAbsoluteLibDirPath();
const polyfillsPath = `${libDirPath}/build/polyfills`;
const nodePolyfillsPath = `${polyfillsPath}/node`;

/**
 * Generates a Map composed by the module name and location
 * @returns {object} - the map with module locations
 */
function builtinsPolyfills() {
  const globals = new Map();
  globals.set('buffer', require.resolve('buffer/'));
  globals.set('process', `${nodePolyfillsPath}/globals/process.js`);
  globals.set('console', require.resolve('console-browserify'));

  const libs = new Map();
  // libs.set('crypto', require.resolve('crypto-browserify/'));
  libs.set('crypto', `${nodePolyfillsPath}/crypto.js`);
  libs.set('process', `${nodePolyfillsPath}/globals/process.js`);
  libs.set('console', require.resolve('console-browserify'));
  libs.set('stream', require.resolve('stream-browserify'));
  libs.set('http', require.resolve('stream-http'));
  libs.set('events', require.resolve('events/'));
  libs.set('os', require.resolve('os-browserify/browser'));
  libs.set('path', require.resolve('path-browserify'));
  libs.set('querystring', require.resolve('querystring-es3'));
  libs.set('url', require.resolve('url/'));
  libs.set('zlib', require.resolve('browserify-zlib'));
  libs.set('accepts', require.resolve('accepts'));
  libs.set('string_decoder', require.resolve('string_decoder/'));
  libs.set('zlib', require.resolve('browserify-zlib'));
  libs.set('async_hooks', false);
  libs.set('tls', false);
  libs.set('net', false);
  libs.set('dns', `${nodePolyfillsPath}/dns.js`);
  libs.set('http2', `${nodePolyfillsPath}/http2.js`);
  libs.set('module', `${nodePolyfillsPath}/module.js`);
  libs.set('fs', `${nodePolyfillsPath}/fs.js`);

  return { libs, globals };
}

export default builtinsPolyfills;
