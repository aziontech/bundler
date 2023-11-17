import { expect } from '@jest/globals';
import Dispatcher from './dispatcher.js';

describe('dispatcher', () => {
  it('should create a Dispatcher instance with correct properties', async () => {
    const config = {
      entry: 'main.js',
      builder: 'esbuild',
      preset: {
        name: 'javascript',
        mode: 'compute',
      },
      useNodePolyfills: false,
      useOwnWorker: false,
      memoryFS: undefined,
      custom: {},
    };

    const expectedDispatcher = {
      entry: 'main.js',
      builder: 'esbuild',
      preset: { name: 'javascript', mode: 'compute' },
      useNodePolyfills: false,
      useOwnWorker: false,
      memoryFS: undefined,
      custom: {},
      buildId: '123456',
    };

    /**
     *
     */
    function mockGenerateTimestamp() {
      return '123456';
    }
    const newDispatcher = new Dispatcher(config, mockGenerateTimestamp());
    expect(newDispatcher).toBeInstanceOf(Dispatcher);
    expect(newDispatcher).toEqual(expectedDispatcher);
  });
});
