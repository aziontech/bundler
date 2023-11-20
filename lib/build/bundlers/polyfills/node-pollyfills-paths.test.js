import { expect, it } from '@jest/globals';
import builtinsPolyfills from './node-polyfills-paths.js';

describe('Node polyfill paths', () => {
  it('Should return map of polyfills', () => {
    const expectedPolyfills = [
      'crypto',
      'process',
      'console',
      'stream',
      'http',
      'events',
      'os',
      'path',
      'querystring',
      'url',
      'zlib',
      'accepts',
      'string_decoder',
      'async_hooks',
      'tls',
      'net',
      'dns',
      'http2',
      'module',
      'fs',
    ];
    const listOfAvailablePolyfills = builtinsPolyfills();
    const arraylistOfAvailablePolyfills = Array.from(
      listOfAvailablePolyfills.libs.keys(),
    );
    expect(arraylistOfAvailablePolyfills).toEqual(expectedPolyfills);
  });
});
