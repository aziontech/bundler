import webpack from 'webpack';
import { join } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = process.cwd();
const isWindows = process.platform === 'win32';
const outputPath = isWindows ? fileURLToPath(new URL(`file:///${join(projectRoot, '.edge')}`)) : join(projectRoot, '.edge');

export default {
  output: {
    path: outputPath,
    filename: 'worker.js',
    globalObject: 'this',
  },
  optimization: {
    minimize: false,
  },
  mode: 'production',
  target: ['webworker', 'es2022'],
  plugins: [new webpack.ProgressPlugin()],
};
