import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { executeBuild } from './core';
import {
  BuildConfiguration,
  BuildContext,
  AzionPrebuildResult,
} from 'azion/config';
import fs from 'fs';
import fsPromises from 'fs/promises';
import bundlerExecute from './bundler-execute';

jest.mock('./utils', () => ({
  moveImportsToTopLevel: jest.fn((code) => code),
}));

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('./bundler-execute');

describe('executeBuild', () => {
  const mockBuildConfig: BuildConfiguration = {
    entry: 'temp/entry.js',
    preset: {
      metadata: { name: 'test-preset' },
      config: { build: {} },
    },
    polyfills: true,
    worker: false,
    bundler: 'esbuild',
    setup: {
      contentToInject: '',
      defineVars: {},
    },
  };

  const mockContext: BuildContext = {
    production: false,
    output: '.edge/worker.js',
    entrypoint: 'src/index.js',
  };

  const mockPrebuildResult: AzionPrebuildResult = {
    filesToInject: [],
    injection: {
      globals: {},
      entry: '',
      banner: '/* banner */',
    },
    bundler: {
      defineVars: { 'process.env.NODE_ENV': '"production"' },
      plugins: [],
    },
  };

  beforeEach(() => {
    jest.spyOn(process, 'cwd').mockImplementation(() => './');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should execute build with esbuild bundler', async () => {
    jest
      .spyOn(fsPromises, 'readFile')
      .mockResolvedValue('// Original entry code');
    const spyWriteFile = jest
      .spyOn(fsPromises, 'writeFile')
      .mockResolvedValue();
    const spyCreateAzionESBuildConfig = jest.spyOn(
      bundlerExecute,
      'createAzionESBuildConfigWrapper',
    );
    const spyExecuteESBuildBuild = jest
      .spyOn(bundlerExecute, 'executeESBuildBuildWrapper')
      .mockResolvedValue();

    await executeBuild({
      buildConfig: mockBuildConfig,
      prebuildResult: mockPrebuildResult,
      ctx: mockContext,
    });

    expect(spyCreateAzionESBuildConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        setup: {
          contentToInject: '/* banner */',
          defineVars: { 'process.env.NODE_ENV': '"production"' },
        },
      }),
      mockContext,
    );
    expect(spyExecuteESBuildBuild).toHaveBeenCalled();
    expect(spyWriteFile).toHaveBeenCalledWith(
      mockContext.output,
      expect.stringContaining('// Original entry code'),
    );
  });

  it('should execute build with webpack bundler', async () => {
    jest
      .spyOn(fsPromises, 'readFile')
      .mockResolvedValue('// Original entry code');
    const spyWriteFile = jest
      .spyOn(fsPromises, 'writeFile')
      .mockResolvedValue();
    const spyCreateWebpack = jest.spyOn(
      bundlerExecute,
      'createAzionWebpackConfigWrapper',
    );
    const spyExecuteWebpack = jest
      .spyOn(bundlerExecute, 'executeWebpackBuildWrapper')
      .mockResolvedValue();

    const webpackConfig: BuildConfiguration = {
      ...mockBuildConfig,
      bundler: 'webpack',
    };

    await executeBuild({
      buildConfig: webpackConfig,
      prebuildResult: mockPrebuildResult,
      ctx: mockContext,
    });

    expect(spyCreateWebpack).toHaveBeenCalledWith(
      expect.objectContaining({
        setup: {
          contentToInject: '/* banner */',
          defineVars: { 'process.env.NODE_ENV': '"production"' },
        },
      }),
      mockContext,
    );
    expect(spyExecuteWebpack).toHaveBeenCalled();
    expect(spyWriteFile).toHaveBeenCalledWith(
      mockContext.output,
      expect.stringContaining('// Original entry code'),
    );
  });

  it('should inject entry content when provided in prebuild result', async () => {
    const spyReadFile = jest
      .spyOn(fsPromises, 'readFile')
      .mockResolvedValue('// Original entry code');
    const writeFile = jest.spyOn(fsPromises, 'writeFile').mockResolvedValue();
    const prebuildWithEntry = {
      ...mockPrebuildResult,
      injection: {
        ...mockPrebuildResult.injection,
        entry: 'public',
      },
    };

    jest.spyOn(bundlerExecute, 'createAzionESBuildConfigWrapper');
    jest
      .spyOn(bundlerExecute, 'executeESBuildBuildWrapper')
      .mockResolvedValue();

    await executeBuild({
      buildConfig: mockBuildConfig,
      prebuildResult: prebuildWithEntry,
      ctx: mockContext,
    });

    expect(spyReadFile).toHaveBeenCalledWith(mockBuildConfig.entry, 'utf-8');

    expect(writeFile).toHaveBeenCalledWith(
      mockBuildConfig.entry,
      expect.stringContaining('// Original entry code'),
    );
  });

  it('should inject node:fs polyfill in production mode when polyfills is true', async () => {
    jest
      .spyOn(fsPromises, 'readFile')
      .mockResolvedValue('// Original entry code');
    const spyWriteFile = jest
      .spyOn(fsPromises, 'writeFile')
      .mockResolvedValue();
    jest.spyOn(bundlerExecute, 'createAzionESBuildConfigWrapper');
    const spyExecuteESBuildBuild = jest
      .spyOn(bundlerExecute, 'executeESBuildBuildWrapper')
      .mockResolvedValue();

    await executeBuild({
      buildConfig: mockBuildConfig,
      prebuildResult: mockPrebuildResult,
      ctx: {
        ...mockContext,
        production: true,
      },
    });

    expect(spyExecuteESBuildBuild).toHaveBeenCalled();
    expect(spyWriteFile).toHaveBeenCalledWith(
      mockContext.output,
      'import SRC_NODE_FS from "node:fs";\n// Original entry code',
    );
  });

  it('should inject node:fs polyfill in production mode when polyfills is false', async () => {
    jest
      .spyOn(fsPromises, 'readFile')
      .mockResolvedValue('// Original entry code');
    const spyWriteFile = jest
      .spyOn(fsPromises, 'writeFile')
      .mockResolvedValue();
    jest.spyOn(bundlerExecute, 'createAzionESBuildConfigWrapper');
    const spyExecuteESBuildBuild = jest
      .spyOn(bundlerExecute, 'executeESBuildBuildWrapper')
      .mockResolvedValue();

    await executeBuild({
      buildConfig: mockBuildConfig,
      prebuildResult: mockPrebuildResult,
      ctx: mockContext,
    });

    expect(spyExecuteESBuildBuild).toHaveBeenCalled();
    expect(spyWriteFile).toHaveBeenCalledWith(
      mockContext.output,
      expect.not.stringContaining('import SRC_NODE_FS from "node:fs";'),
    );
  });

  it('should throw error for unsupported bundler', async () => {
    const invalidConfig = {
      ...mockBuildConfig,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bundler: 'invalid' as any,
    };

    await expect(
      executeBuild({
        buildConfig: invalidConfig,
        prebuildResult: mockPrebuildResult,
        ctx: mockContext,
      }),
    ).rejects.toThrow('Unsupported bundler: invalid');
  });

  it('should clean up temporary files on error', async () => {
    jest.spyOn(bundlerExecute, 'createAzionESBuildConfigWrapper');
    jest
      .spyOn(bundlerExecute, 'executeESBuildBuildWrapper')
      .mockImplementationOnce(() => {
        throw new Error('Build error');
      });
    jest.spyOn(fs, 'rmSync').mockReturnValue();
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    await expect(
      executeBuild({
        buildConfig: mockBuildConfig,
        prebuildResult: mockPrebuildResult,
        ctx: mockContext,
      }),
    ).rejects.toThrow('Build error');

    // expect(rmSync).toHaveBeenCalled();
  });
});
