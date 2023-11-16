import { expect, it } from '@jest/globals';
import builtinsPolyfills from './node-polyfills-paths.js';

describe('Node polyfill paths', () => {
  it('Should return map of polyfills', () => {
    const expectedPolyfills = [
      'process',
      'buffer',
      'util',
      'sys',
      'events',
      'stream',
      'path',
      'querystring',
      'punycode',
      'url',
      'string_decoder',
      'http',
      'https',
      'os',
      'assert',
      'constants',
      '_stream_duplex',
      '_stream_passthrough',
      '_stream_readable',
      '_stream_writable',
      '_stream_transform',
      'console',
      'zlib',
      'tty',
      'domain',
    ];
    const listOfAvailablePolyfills = builtinsPolyfills();
    const arraylistOfAvailablePolyfills = Array.from(
      listOfAvailablePolyfills.keys(),
    );

    expect(arraylistOfAvailablePolyfills).toEqual(expectedPolyfills);
  });
});
