import { promisify } from 'util';
import webpack from 'webpack';
import fs from 'fs';
import tmp from 'tmp';
import NodePolyfillPlugin from './node-polyfills.plugins.js';

globalThis.vulcan = { buildProd: true };

describe('Webpack Node Plugin', () => {
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

  it('should check the (NODE_ENV) in Environment and resolve module crypto', async () => {
    const code = `import crypto from 'crypto';console.log(process.env.NODE_ENV);`;
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
      plugins: [new NodePolyfillPlugin(true)],
    });
    const bundle = fs.readFileSync(tmpOutput.name, 'utf-8');
    expect(bundle).toContain('console.log("test")');
  }, 20000);
});
