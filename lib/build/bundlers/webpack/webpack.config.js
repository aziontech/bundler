import webpack from 'webpack';
import { join } from 'path';
import { packageDirectory } from 'pkg-dir';
import { getAzionVersionId } from '#utils';

const projectRoot = await packageDirectory();
const outputPath = join(projectRoot, '.edge');

export default {
  output: {
    path: outputPath,
    filename: 'worker.js',
    globalObject: 'this',
  },
  mode: 'production',
  target: 'webworker',
  plugins: [
    new webpack.DefinePlugin({
      AZION: {
        VERSION_ID: getAzionVersionId(),
      },
    }),
  ],
};
