import fs from 'fs';
import tmp from 'tmp';
import Webpack from './index.js';

describe('Webpack Bundler', () => {
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

  it('should must run() success', async () => {
    const code = `import crypto from 'crypto';console.log(process.env.NODE_ENV);`;
    await fs.promises.writeFile(tmpEntry.name, code);

    const bundler = new Webpack({
      buildId: '12345',
      custom: {},
      entry: tmpEntry.name,
      localCustom: {
        optimization: {
          minimize: false,
        },
        output: {
          path: tmpDir.name,
          filename: 'output.js',
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

    const result = fs.readFileSync(tmpOutput.name, 'utf-8');

    expect(result).toContain('./lib/build/bundlers/polyfills/node/crypto.js');
  }, 20000);
});
