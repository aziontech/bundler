import webpack from 'webpack';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { generateTimestamp } from '#utils';
import { fileURLToPath } from 'url';

const projectRoot = process.cwd();
const isWindows = process.platform === 'win32';
const outputPath = isWindows ? fileURLToPath(new URL(`file:///${join(projectRoot, '.edge')}`)) : join(projectRoot, '.edge');

/**
 * Generates a build ID and saves it in the .env file (for deploy).
 * @returns {Promise<string>} The generated build ID.
 */
async function generateBuildId() {
  const envFilePath = join(outputPath, '.env');
  const BUILD_VERSION___AKA__VERSION_ID = generateTimestamp();
  const envContent = `VERSION_ID=${BUILD_VERSION___AKA__VERSION_ID}`;

  await mkdir(outputPath, { recursive: true });
  await writeFile(envFilePath, envContent);
  return BUILD_VERSION___AKA__VERSION_ID;
}

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
        VERSION_ID: JSON.stringify(await generateBuildId()),
      },
    }),
  ],
};
