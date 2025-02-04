import fs from 'fs';
import tmp from 'tmp';
import Esbuild from './esbuild.bundlers.js';
import AzionEsbuildConfig from './esbuild.config.js';

// IN MILESECONDS
const TIMEOUT = 20000;

describe('Esbuild Bundler', () => {
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

      const bundler = new Esbuild({
        custom: {},
        entry: tmpEntry.name,
        localCustom: {
          outfile: tmpOutput.name,
          minify: false,
        },
        polyfills: true,
        worker: false,
        preset: { name: 'javascript' },
      });
      await bundler.run();

      const result = fs.readFileSync(tmpOutput.name, 'utf-8');

      expect(result).toContain(
        'node-built-in-modules:unenv/runtime/node/crypto/index',
      );
    },
    TIMEOUT,
  );

  it(
    'should merge the config, in this case optimization.minimize false',
    async () => {
      const bundler = new Esbuild({
        custom: {
          minify: true,
        },
        entry: tmpEntry.name,
        localCustom: {
          outfile: tmpOutput.name,
          minify: false,
        },
        polyfills: false,
        worker: false,
        preset: { name: 'javascript' },
      });
      let config = AzionEsbuildConfig;
      config = bundler.mergeConfig(config);
      expect(config?.minify).toBeFalsy();
    },
    TIMEOUT,
  );
});
