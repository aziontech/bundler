import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { setupWorkerCode } from './worker';
import { BuildConfiguration } from 'azion/config';
import fsPromises from 'fs/promises';

jest.mock('./utils', () => {
  return {
    normalizeEntryPointPaths: jest.fn((handler) => (Array.isArray(handler) ? handler : [handler])),
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
    worker: false,
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
        Promise.resolve(String(path).includes('api') ? 'api code' : 'worker code'),
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return mapped entries with original code when worker=true', async () => {
    const configWithWorker = { ...mockBuildConfig, worker: true };

    const result = await setupWorkerCode(configWithWorker, mockContext);

    expect(result).toEqual({
      '/tmp/worker.js': 'worker code',
      '/tmp/api.js': 'api code',
    });
    expect(spyReadFile).toHaveBeenCalledWith('/tmp/worker.js', 'utf-8');
    expect(spyReadFile).toHaveBeenCalledWith('/tmp/api.js', 'utf-8');
  });

  it('should return mapped entries with generated code when worker=false', async () => {
    const result = await setupWorkerCode(mockBuildConfig, mockContext);

    // Verificar apenas que as chaves estão corretas
    expect(Object.keys(result).sort()).toEqual(['/tmp/worker.js', '/tmp/api.js'].sort());

    // Verificar que o conteúdo contém o import correto
    expect(result['/tmp/worker.js']).toContain(`import entrypoint from '/tmp/worker.js'`);
    expect(result['/tmp/api.js']).toContain(`import entrypoint from '/tmp/api.js'`);

    // Verificar que o conteúdo contém outros elementos esperados
    expect(result['/tmp/worker.js']).toContain('addEventListener(eventType, (event)');
    expect(result['/tmp/api.js']).toContain('addEventListener(eventType, (event)');
  });

  it('should throw error when setup fails', async () => {
    spyReadFile.mockRejectedValue(new Error('Read error'));

    await expect(
      setupWorkerCode({ ...mockBuildConfig, worker: true }, mockContext),
    ).rejects.toThrow('Failed to setup worker code: Read error');
  });
});
