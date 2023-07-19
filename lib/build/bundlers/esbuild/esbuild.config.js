import { join } from 'path';

const projectRoot = process.cwd();
const outputPath = join(projectRoot, '.edge');

export default {
  bundle: true,
  minify: true,
  target: 'es2022',
  platform: 'neutral',
  outfile: join(outputPath, 'worker.js'),
};
