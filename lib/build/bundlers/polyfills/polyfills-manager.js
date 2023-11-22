import { createRequire } from 'module';
import { getAbsoluteLibDirPath } from '#utils';

const require = createRequire(import.meta.url);
const libDirPath = getAbsoluteLibDirPath();
const polyfillsPath = `${libDirPath}/build/bundlers/polyfills`;
const nodePolyfillsPath = `${polyfillsPath}/node`;

class PolyfillsManager {
  constructor() {
    this.globals = new Map();
    this.libs = new Map();
  }

  setGlobal(name, path) {
    this.globals.set(name, path);
  }

  setLib(name, path) {
    this.libs.set(name, path);
  }

  buildPolyfills() {
    this.setGlobal('buffer', require.resolve('buffer/'));
    this.setGlobal('console', require.resolve('console-browserify'));
    this.setGlobal('navigator', `${nodePolyfillsPath}/globals/navigator.js`);
    this.setGlobal(
      'performance',
      `${nodePolyfillsPath}/globals/performance.js`,
    );
    this.setGlobal('process', `${nodePolyfillsPath}/globals/process.js`);

    this.setLib('accepts', require.resolve('accepts'));
    this.setLib('async_hooks', false);
    this.setLib('buffer', require.resolve('buffer/'));
    this.setLib('child_process', false);
    this.setLib('cluster', false);
    this.setLib('console', require.resolve('console-browserify'));
    this.setLib('crypto', `${nodePolyfillsPath}/crypto.js`);
    this.setLib('dgram', false);
    this.setLib('dns', `${nodePolyfillsPath}/dns.js`);
    this.setLib('events', require.resolve('events/'));
    this.setLib('fs', `${nodePolyfillsPath}/fs.js`);
    this.setLib('http', require.resolve('stream-http'));
    this.setLib('http2', `${nodePolyfillsPath}/http2.js`);
    this.setLib('https', require.resolve('stream-http'));
    this.setLib('inspector', false);
    this.setLib('module', `${nodePolyfillsPath}/module.js`);
    this.setLib('net', false);
    this.setLib('os', require.resolve('os-browserify/browser'));
    this.setLib('path', require.resolve('path-browserify'));
    this.setLib('perf_hooks', false);
    this.setLib('process', `${nodePolyfillsPath}/globals/process.js`);
    this.setLib('querystring', require.resolve('querystring-es3/'));
    this.setLib('readline', false);
    this.setLib('repl', false);
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
    this.setLib('tls', false);
    this.setLib('tty', require.resolve('tty-browserify'));
    this.setLib('url', require.resolve('url/'));
    this.setLib('util', require.resolve('util/util.js'));
    this.setLib('vm', require.resolve('vm-browserify'));
    this.setLib('zlib', require.resolve('browserify-zlib'));
    this.setLib('_process', require.resolve('process/browser'));

    return { libs: this.libs, globals: this.globals };
  }
}

export default new PolyfillsManager();
