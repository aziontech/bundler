import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { setupWorkerCode } from './worker';
import util from './utils';
import { BuildConfiguration, BuildContext } from 'azion/config';
import fsPromises from 'fs/promises';

describe('setupWorkerCode', () => {
  let spyReadFile: jest.SpiedFunction<typeof fsPromises.readFile>;
  let spyWriteFile: jest.SpiedFunction<typeof fsPromises.writeFile>;
  let spyMkdir: jest.SpiedFunction<typeof fsPromises.mkdir>;
  let spyCreateEventHandlerCode: jest.SpiedFunction<
    typeof util.createEventHandlerCode
  >;

  const mockBuildConfig: BuildConfiguration = {
    entry: 'temp/azion-123.temp.js',
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

  const mockContext: BuildContext = {
    production: true,
    output: '.edge/worker.js',
    entrypoint: 'src/index.js',
  };

  const mockWorkerCode = 'addEventListener("fetch", event => {})';

  beforeEach(() => {
    spyReadFile = jest
      .spyOn(fsPromises, 'readFile')
      .mockResolvedValue('original code');
    spyWriteFile = jest.spyOn(fsPromises, 'writeFile').mockResolvedValue();
    spyMkdir = jest
      .spyOn(fsPromises, 'mkdir')
      .mockImplementation(() => Promise.resolve(void 0));
    spyCreateEventHandlerCode = jest
      .spyOn(util, 'createEventHandlerCode')
      .mockReturnValue(mockWorkerCode);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return original code when worker=true', async () => {
    const configWithWorker = { ...mockBuildConfig, worker: true };

    const result = await setupWorkerCode(configWithWorker, mockContext);

    expect(spyReadFile).toHaveBeenCalledWith(mockContext.entrypoint, 'utf-8');
    expect(spyMkdir).not.toHaveBeenCalled();
    expect(result).toBe('original code');
  });

  it('should generate wrapper code when worker=false', async () => {
    const result = await setupWorkerCode(mockBuildConfig, mockContext);

    expect(spyCreateEventHandlerCode).toHaveBeenCalledWith(
      mockContext.entrypoint,
    );
    expect(spyMkdir).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(spyWriteFile).toHaveBeenCalledWith(
      mockContext.output,
      mockWorkerCode,
      'utf-8',
    );
    expect(result).toBe(mockWorkerCode);
  });

  it('should throw error when worker code setup fails', async () => {
    spyReadFile.mockImplementation(() =>
      Promise.reject(new Error('Failed to setup worker code: Read error')),
    );

    await expect(
      setupWorkerCode({ ...mockBuildConfig, worker: true }, mockContext),
    ).rejects.toThrow('Failed to setup worker code: Read error');
  });
});
