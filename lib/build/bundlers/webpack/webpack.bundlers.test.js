import fs from 'fs';
import tmp from 'tmp';
import Webpack from './webpack.bundlers.js';
import AzionWebpackConfig from './webpack.config.js';

// IN MILESECONDS
const TIMEOUT = 20000;

describe('Webpack Bundler', () => {
  globalThis.vulcan = { buidProd: true };
  let tmpDir;
  let tmpEntry;
  let tmpOutput;

  beforeEach(async () => {
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

  afterEach(async () => {
    tmpEntry.removeCallback();
    tmpOutput.removeCallback();
    tmpDir.removeCallback();
  });

  it(
    'should execute the bundle successfully',
    async () => {
      const code = `import crypto from 'crypto';console.log(process.env.NODE_ENV);`;
      await fs.promises.writeFile(tmpEntry.name, code);

      const bundler = new Webpack({
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
        polyfills: true,
        useOwnWorker: false,
        preset: { name: 'javascript' },
      });
      await bundler.run();

      const result = fs.readFileSync(tmpOutput.name, 'utf-8');

      expect(result).toContain('./lib/build/bundlers/polyfills/node/crypto.js');
    },
    TIMEOUT,
  );

  it(
    'should merge the config, in this case optimization.minimize false',
    async () => {
      const bundler = new Webpack({
        custom: {
          optimization: {
            minimize: true,
          },
        },
        entry: tmpEntry.name,
        localCustom: {
          optimization: {
            minimize: false,
          },
        },
        polyfills: false,
        useOwnWorker: false,
        preset: { name: 'javascript' },
      });
      let config = AzionWebpackConfig;
      config = bundler.mergeConfig(config);
      expect(config?.optimization?.minimize).toBeFalsy();
    },
    TIMEOUT,
  );
});
