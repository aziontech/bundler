import { promisify } from 'util';
import webpack from 'webpack';
import path from 'path';
import { readFile, rmdir } from 'fs/promises';
import NodePolyfillPlugin from './index.js';

describe('Webpack Node Plugin', () => {
  const outputPath = path.resolve(__dirname, './dist');

  afterAll(async () => {
    await rmdir(outputPath, { recursive: true, force: true });
  });

  it('should check the (NODE_ENV) in Environment and resolve module crypto', async () => {
    const runWebpack = promisify(webpack);

    await runWebpack({
      entry: path.resolve(__dirname, './mock/index.js'),
      mode: 'production',
      optimization: {
        minimize: false,
      },
      output: {
        path: outputPath,
        filename: 'bundle.js',
      },
      target: ['webworker', 'es2022'],
      plugins: [new NodePolyfillPlugin()],
    });
    const bundle = await readFile(`${outputPath}/bundle.js`, 'utf-8');
    expect(bundle).toContain('console.log("production")');
    expect(bundle).toContain('./lib/build/bundlers/polyfills/node/crypto.js');
  });
});
