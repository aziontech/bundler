import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { setupWorkerCode } from './worker';
import { BuildConfiguration } from 'azion/config';
import fsPromises from 'fs/promises';

jest.mock('./utils', () => {
  const original = jest.requireActual<typeof import('./utils')>('./utils');
  return {
    generateWorkerEventHandler: original.generateWorkerEventHandler,
    normalizeEntryPointPaths: jest.fn((handler) => (Array.isArray(handler) ? handler : [handler])),
    isServiceWorkerPattern: original.isServiceWorkerPattern,
  };
});

describe('setupWorkerCode', () => {
  let spyReadFile: jest.SpiedFunction<typeof fsPromises.readFile>;

  const mockBuildConfig: BuildConfiguration = {
    entry: {
      'azion-worker-123.temp.js': '/tmp/worker.js',
      'azion-api-123.temp.js': '/tmp/api.js',
    },
    preset: {
      metadata: { name: 'test-preset' },
      config: { build: {} },
    },
    polyfills: true,
    setup: {
      contentToInject: undefined,
      defineVars: {},
    },
  };

  const mockContext = {
    production: true,
    handler: ['/tmp/worker.js', '/tmp/api.js'],
  };

  beforeEach(() => {
    spyReadFile = jest
      .spyOn(fsPromises, 'readFile')
      .mockImplementation((path: unknown) =>
        Promise.resolve(
          String(path).includes('api')
            ? `addEventListener('fetch', (event) => { event.respondWith(new Response('api')); });`
            : `addEventListener('fetch', (event) => { event.respondWith(new Response('worker')); });`,
        ),
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return mapped entries with original code for service worker pattern', async () => {
    const result = await setupWorkerCode(mockBuildConfig, mockContext);

    // Service Worker pattern should return original code
    expect(result['/tmp/worker.js']).toContain(`addEventListener('fetch', (event) => {`);
    expect(result['/tmp/worker.js']).toContain(`new Response('worker')`);
    expect(result['/tmp/api.js']).toContain(`addEventListener('fetch', (event) => {`);
    expect(result['/tmp/api.js']).toContain(`new Response('api')`);

    expect(spyReadFile).toHaveBeenCalledWith('/tmp/worker.js', 'utf-8');
    expect(spyReadFile).toHaveBeenCalledWith('/tmp/api.js', 'utf-8');
  });

  it('should return mapped entries with generated code for ESM pattern in development', async () => {
    // Mock ESM pattern
    spyReadFile.mockImplementation((path: unknown) =>
      Promise.resolve(
        String(path).includes('api')
          ? `export default { fetch: (request, env, ctx) => new Response('api esm') };`
          : `export default { fetch: (request, env, ctx) => new Response('worker esm') };`,
      ),
    );

    const devContext = { ...mockContext, production: false };
    const result = await setupWorkerCode(mockBuildConfig, devContext);

    // ESM in development should be wrapped with addEventListener
    expect(result['/tmp/worker.js']).toContain(`import module from '/tmp/worker.js'`);
    expect(result['/tmp/worker.js']).toContain(`addEventListener('fetch', (event) => {`);
    expect(result['/tmp/api.js']).toContain(`import module from '/tmp/api.js'`);
    expect(result['/tmp/api.js']).toContain(`addEventListener('fetch', (event) => {`);
  });

  it('should return original code for ESM pattern in production', async () => {
    // Mock ESM pattern
    spyReadFile.mockImplementation((path: unknown) =>
      Promise.resolve(
        String(path).includes('api')
          ? `export default { fetch: (request, env, ctx) => new Response('api esm') };`
          : `export default { fetch: (request, env, ctx) => new Response('worker esm') };`,
      ),
    );

    const result = await setupWorkerCode(mockBuildConfig, mockContext);

    // ESM in production should return original code
    expect(result['/tmp/worker.js']).toContain(`export default { fetch: (request, env, ctx) =>`);
    expect(result['/tmp/worker.js']).toContain(`new Response('worker esm')`);
    expect(result['/tmp/api.js']).toContain(`export default { fetch: (request, env, ctx) =>`);
    expect(result['/tmp/api.js']).toContain(`new Response('api esm')`);
  });

  it('should handle legacy pattern with wrapper generation', async () => {
    // Mock legacy pattern
    spyReadFile.mockImplementation(() =>
      Promise.resolve(`export default function handler() { return new Response('legacy'); }`),
    );

    const result = await setupWorkerCode(mockBuildConfig, mockContext);

    // Legacy should be wrapped with addEventListener
    expect(result['/tmp/worker.js']).toContain('import handler from');
    expect(result['/tmp/worker.js']).toContain("addEventListener('fetch'");
    expect(result['/tmp/worker.js']).toContain('event.respondWith');
  });

  it('should throw error when setup fails', async () => {
    spyReadFile.mockRejectedValue(new Error('Read error'));

    await expect(setupWorkerCode({ ...mockBuildConfig }, mockContext)).rejects.toThrow(
      'Failed to setup worker code: Read error',
    );
  });
});
