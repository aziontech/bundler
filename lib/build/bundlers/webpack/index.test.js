import fs from 'fs';
import path from 'path';
import Webpack from './index.js';

describe('Webpack Bundler', () => {
  const workDir = path.resolve(__dirname, './dist');
  const entry = path.join(workDir, 'entry.js');
  const outfile = path.join(workDir, 'worker.js');

  beforeEach(async () => {
    await fs.promises.mkdir(workDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.promises.rmdir(workDir, { recursive: true, force: true });
  });

  it('should must run() success', async () => {
    const code = `import crypto from 'crypto';console.log(process.env.NODE_ENV);`;
    await fs.promises.writeFile(entry, code);

    const bundler = new Webpack({
      buildId: '12345',
      custom: {},
      entry,
      localCustom: {
        optimization: {
          minimize: false,
        },
        output: {
          path: workDir,
          filename: 'worker.js',
        },
        infrastructureLogging: {
          level: 'error',
        },
      },
      useNodePolyfills: true,
      useOwnWorker: false,
      preset: {
        name: 'javascript',
        mode: 'compute',
      },
    });
    await bundler.run();

    const result = fs.readFileSync(outfile, 'utf-8');

    expect(result).toContain('./lib/build/bundlers/polyfills/node/crypto.js');
  }, 20000);
});
