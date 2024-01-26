import { expect, it } from '@jest/globals';
import PolyfillsManager from './index.js';

describe('Polyfills Manager', () => {
  it('Should return map of polyfills', () => {
    const expectedPolyfills = [
      'accepts',
      'buffer',
      'child_process',
      'cluster',
      'console',
      'crypto',
      'dgram',
      'dns',
      'events',
      'fs',
      'http',
      'http2',
      'https',
      'inspector',
      'module',
      'net',
      'os',
      'path',
      'perf_hooks',
      'process',
      'querystring',
      'readline',
      'repl',
      'stream',
      '_stream_passthrough',
      '_stream_readable',
      '_stream_transform',
      '_stream_writable',
      'string_decoder',
      'sys',
      'timers',
      'tls',
      'tty',
      'url',
      'util',
      'vm',
      'zlib',
      'next/dist/compiled/etag',
      '@fastly/http-compute-js',
    ];
    const arraylistOfAvailablePolyfills = Array.from(
      PolyfillsManager.buildPolyfills().libs.keys(),
    );
    expect(arraylistOfAvailablePolyfills).toEqual(expectedPolyfills);
  });
});
