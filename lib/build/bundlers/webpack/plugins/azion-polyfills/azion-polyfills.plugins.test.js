import { promisify } from 'util';
import webpack from 'webpack';
import fs from 'fs';
import tmp from 'tmp';
import AzionPolyfillPlugin from './azion-polyfills.plugins.js';

globalThis.vulcan = { buildProd: true };

describe('Webpack Azion Plugin', () => {
  let tmpDir;
  let tmpEntry;
  let tmpOutput;

  beforeAll(async () => {
    tmpDir = tmp.dirSync();
    tmpEntry = tmp.fileSync({
      postfix: '.js',
      dir: tmpDir.name,
      name: 'entry.js',
    });
    tmpOutput = tmp.fileSync({
      postfix: '.js',
      dir: tmpDir.name,
      name: 'output.js',
    });
  });

  afterAll(async () => {
    tmpEntry.removeCallback();
    tmpOutput.removeCallback();
    tmpDir.removeCallback();
  });

  it('should resolve the azion module: for local execution', async () => {
    const code = `import storage from 'azion:storage';`;
    await fs.promises.writeFile(tmpEntry.name, code);

    const runWebpack = promisify(webpack);

    await runWebpack({
      entry: tmpEntry.name,
      mode: 'production',
      optimization: {
        minimize: false,
      },
      output: {
        path: tmpDir.name,
        filename: 'output.js',
      },
      target: ['webworker', 'es2022'],
      plugins: [new AzionPolyfillPlugin(false)],
    });
    const bundle = fs.readFileSync(tmpOutput.name, 'utf-8');
    expect(bundle).toContain(
      './lib/env/polyfills/azion/storage/storage.polyfills.js',
    );
  }, 20000);

  it('should resolve the azion module: as external', async () => {
    const code = `import storage from 'azion:storage';`;
    await fs.promises.writeFile(tmpEntry.name, code);

    const runWebpack = promisify(webpack);

    await runWebpack({
      experiments: {
        outputModule: true,
      },
      entry: tmpEntry.name,
      mode: 'production',
      optimization: {
        minimize: false,
      },
      output: {
        path: tmpDir.name,
        filename: 'output.js',
      },
      target: ['webworker', 'es2022'],
      plugins: [new AzionPolyfillPlugin(true)],
    });
    const bundle = fs.readFileSync(tmpOutput.name, 'utf-8');
    expect(bundle).toContain('external "azion:storage"');
  }, 20000);
});
