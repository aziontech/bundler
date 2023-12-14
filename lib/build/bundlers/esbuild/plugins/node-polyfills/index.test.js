import * as esbuild from 'esbuild';
import ESBuildNodeModulePlugin from './index.js';

describe('Esbuild Node Plugin', () => {
  it('should check the env (NODE_ENV) in define options', async () => {
    const results = await esbuild.build({
      write: false,
      stdin: {
        contents: 'console.log(process.env.NODE_ENV)',
      },
      plugins: [ESBuildNodeModulePlugin()],
    });

    expect(results.outputFiles.at(0)?.text.trim()).toContain(
      'console.log("production");',
    );
  });

  it('should resolve global crypto polyfill', async () => {
    const results = await esbuild.build({
      write: false,
      target: 'es2022',
      format: 'esm',
      platform: 'browser',
      mainFields: ['browser', 'main', 'module'],
      bundle: true,
      minify: false,
      stdin: {
        contents: 'import crypto from "crypto";',
      },
      plugins: [ESBuildNodeModulePlugin()],
    });

    expect(results.outputFiles.at(0)?.text.trim()).toContain(
      'vulcan-node-modules-polyfills:crypto',
    );
  });
});
