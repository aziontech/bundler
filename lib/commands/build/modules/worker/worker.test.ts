import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { setupWorkerCode } from './worker';
import { BuildConfiguration } from 'azion/config';
import fsPromises from 'fs/promises';
import { generateWorkerEventHandler } from './utils';

describe('setupWorkerCode', () => {
  let spyReadFile: jest.SpiedFunction<typeof fsPromises.readFile>;

  const mockBuildConfig: BuildConfiguration = {
    entry: {
      main: '/tmp/worker.js',
      api: '/tmp/api.js',
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

    const result = await setupWorkerCode(configWithWorker);

    expect(result).toEqual({
      '/tmp/worker.js': 'worker code',
      '/tmp/api.js': 'api code',
    });
    expect(spyReadFile).toHaveBeenCalledWith('/tmp/worker.js', 'utf-8');
    expect(spyReadFile).toHaveBeenCalledWith('/tmp/api.js', 'utf-8');
  });

  it('should return mapped entries with generated code when worker=false', async () => {
    const result = await setupWorkerCode(mockBuildConfig);

    expect(result).toEqual({
      '/tmp/worker.js': generateWorkerEventHandler('/tmp/worker.js'),
      '/tmp/api.js': generateWorkerEventHandler('/tmp/api.js'),
    });
  });

  it('should throw error when setup fails', async () => {
    spyReadFile.mockRejectedValue(new Error('Read error'));

    await expect(setupWorkerCode({ ...mockBuildConfig, worker: true })).rejects.toThrow(
      'Failed to setup worker code: Read error',
    );
  });
});
