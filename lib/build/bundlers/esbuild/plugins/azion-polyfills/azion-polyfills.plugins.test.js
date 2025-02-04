import * as esbuild from 'esbuild';
import ESBuildAzionModulePlugin from './azion-polyfills.plugins.js';

globalThis.vulcan = { buildProd: true };

describe('Esbuild Azion Plugin', () => {
  it('should resolve the azion module: as external', async () => {
    const results = await esbuild.build({
      write: false,
      target: 'es2022',
      format: 'esm',
      platform: 'browser',
      mainFields: ['browser', 'main', 'module'],
      bundle: true,
      minify: false,
      stdin: {
        contents: 'import storage from "azion:storage";',
      },
      plugins: [ESBuildAzionModulePlugin(true)],
    });

    expect(results.outputFiles.at(0)?.text.trim()).toContain(
      'import storage from "azion:storage";',
    );
  });

  it('should resolve the azion module: for local execution', async () => {
    const results = await esbuild.build({
      write: false,
      target: 'es2022',
      format: 'esm',
      platform: 'browser',
      mainFields: ['browser', 'main', 'module'],
      bundle: true,
      minify: false,
      stdin: {
        contents: 'import storage from "azion:storage";',
      },
      plugins: [ESBuildAzionModulePlugin(false)],
    });

    expect(results.outputFiles.at(0)?.text.trim()).toContain(
      'bundler-azion-modules-polyfills',
    );
  });
});
