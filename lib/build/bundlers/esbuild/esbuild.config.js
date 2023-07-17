import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { generateTimestamp } from '#utils';

const projectRoot = process.cwd();
const outputPath = join(projectRoot, '.edge');

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
  bundle: true,
  minify: true,
  target: 'es2022',
  platform: 'neutral',
  define: {
    AZION_VERSION_ID: JSON.stringify(await generateBuildId()),
  },
  outfile: join(outputPath, 'worker.js'),
};
