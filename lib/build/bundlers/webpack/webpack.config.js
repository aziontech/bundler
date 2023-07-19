import webpack from 'webpack';
import { join } from 'path';

const projectRoot = process.cwd();
const outputPath = join(projectRoot, '.edge');

export default {
  output: {
    path: outputPath,
    filename: 'worker.js',
    globalObject: 'this',
  },
  mode: 'production',
  target: ['webworker', 'es2022'],
  plugins: [new webpack.ProgressPlugin()],
};
