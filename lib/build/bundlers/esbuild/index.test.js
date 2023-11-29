import fs from 'fs';
import path from 'path';
import Esbuild from './index.js';

describe('Esbuild Bundler', () => {
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

    const bundler = new Esbuild({
      buildId: '12345',
      custom: {},
      entry,
      localCustom: {
        outfile,
        minify: false,
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

    expect(result).toContain('vulcan-node-modules-polyfills:crypto');
  }, 20000);
});
