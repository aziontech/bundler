import { join } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = process.cwd();
const isWindows = process.platform === 'win32';
const outputPath = isWindows
  ? fileURLToPath(new URL(`file:///${join(projectRoot, '.edge')}`))
  : join(projectRoot, '.edge');

export default {
  bundle: true,
  minify: true,
  target: 'es2022',
  format: 'esm',
  platform: 'browser',
  mainFields: ['browser', 'main', 'module'],
  loader: {
    '.js': 'jsx',
  },
  outfile: join(outputPath, 'worker.js'),
};
