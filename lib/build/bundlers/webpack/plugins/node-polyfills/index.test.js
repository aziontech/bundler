import { promisify } from 'util';
import webpack from 'webpack';
import path from 'path';
import fs from 'fs';
import NodePolyfillPlugin from './index.js';

describe('Webpack Node Plugin', () => {
  const workDir = path.resolve(__dirname, './dist');
  const entry = path.join(workDir, 'entry.js');
  const outfile = path.join(workDir, 'worker.js');

  beforeEach(async () => {
    await fs.promises.mkdir(workDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.promises.rmdir(workDir, { recursive: true, force: true });
  });

  it('should check the (NODE_ENV) in Environment and resolve module crypto', async () => {
    const code = `import crypto from 'crypto';console.log(process.env.NODE_ENV);`;
    await fs.promises.writeFile(entry, code);

    const runWebpack = promisify(webpack);

    await runWebpack({
      entry,
      mode: 'production',
      optimization: {
        minimize: false,
      },
      output: {
        path: workDir,
        filename: 'worker.js',
      },
      target: ['webworker', 'es2022'],
      plugins: [new NodePolyfillPlugin()],
    });
    const bundle = await fs.promises.readFile(outfile, 'utf-8');
    expect(bundle).toContain('console.log("production")');
    expect(bundle).toContain('./lib/build/bundlers/polyfills/node/crypto.js');
  }, 20000);
});
