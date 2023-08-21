import {
  exec, feedback, getPackageManager, copyDirectory,
} from '#utils';
import { lstat, readFile, rm } from 'fs/promises';
import { join } from 'path';

const packageManager = await getPackageManager();
const edgeStorageDir = '.edge/storage';
const defaultViteOutDir = 'dist';

/**
 * Check if the vite.config.js file exists.
 * @returns {boolean} True if the file exists, false otherwise.
 */
async function viteConfigExists() {
  try {
    await lstat('./vite.config.js');
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Read and parse the vite.config.js file.
 * @returns {object} The parsed configuration object or null if the file doesn't exist.
 */
async function readViteConfig() {
  try {
    const configFileContent = await readFile('./vite.config.js', 'utf-8');
    return JSON.parse(configFileContent.replace(/^module.exports = /, ''));
  } catch (err) {
    return null;
  }
}

/**
 * Runs custom prebuild actions.
 */
async function prebuild() {
  const npmArgsForward = packageManager === 'npm' ? '--' : '';

  try {
    let outDir = defaultViteOutDir;
    let destPath = edgeStorageDir;

    const isViteProject = await viteConfigExists();

    if (isViteProject) {
      await exec(
        `${packageManager} run build ${npmArgsForward}`,
        'Vue/Vite',
        true,
      );

      const config = await readViteConfig();

      if (config?.build?.outDir) {
        outDir = config.build.outDir;
      }

      const srcPath = join('.', outDir);
      destPath = join(edgeStorageDir);
      copyDirectory(outDir, srcPath);
      rm(outDir, { recursive: true, force: true });
    }

    if (!isViteProject) {
      await exec(
        `${packageManager} run build ${npmArgsForward} --dest ${destPath}`,
        'Vue',
        true,
      );
    }
  } catch (error) {
    feedback.prebuild.error(error);
  }
}

export default prebuild;
