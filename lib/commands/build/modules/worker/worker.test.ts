import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { setupWorkerCode } from './worker';
import { createEventHandlerCode } from './utils';
import { BuildConfiguration, BuildContext } from 'azion/config';

const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();

jest.mock('fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}));

jest.mock('./utils', () => ({
  createEventHandlerCode: jest.fn(),
}));

describe('setupWorkerCode', () => {
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
    jest.clearAllMocks();
    mockReadFile.mockImplementation(() => Promise.resolve('original code'));
    (createEventHandlerCode as jest.Mock).mockReturnValue(mockWorkerCode);
  });

  it('should return original code when worker=true', async () => {
    const configWithWorker = { ...mockBuildConfig, worker: true };

    const result = await setupWorkerCode(configWithWorker, mockContext);

    expect(mockReadFile).toHaveBeenCalledWith(mockContext.entrypoint, 'utf-8');
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(result).toBe('original code');
  });

  it('should generate wrapper code when worker=false', async () => {
    const result = await setupWorkerCode(mockBuildConfig, mockContext);

    expect(createEventHandlerCode).toHaveBeenCalledWith(mockContext.entrypoint);
    expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(mockWriteFile).toHaveBeenCalledWith(
      mockContext.output,
      mockWorkerCode,
      'utf-8',
    );
    expect(result).toBe(mockWorkerCode);
  });

  it('should throw error when worker code setup fails', async () => {
    mockReadFile.mockImplementation(() =>
      Promise.reject(new Error('Read error')),
    );

    await expect(
      setupWorkerCode({ ...mockBuildConfig, worker: true }, mockContext),
    ).rejects.toThrow('Failed to setup worker code: Read error');
  });
});
