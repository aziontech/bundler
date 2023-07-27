import { exec, feedback, getPackageManager } from '#utils';
import {
  copyFile, mkdir, readdir, lstat, readFile,
} from 'fs/promises';
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
 * Copy files and directories from one directory to another.
 * @param {string} srcDir - Source directory.
 * @param {string} destDir - Destination directory.
 */
async function copyFiles(srcDir, destDir) {
  const files = await readdir(srcDir);

  await Promise.all(files.map(async (file) => {
    const srcPath = join(srcDir, file);
    const destPath = join(destDir, file);
    const stats = await lstat(srcPath);

    if (stats.isFile()) {
      await copyFile(srcPath, destPath);
    } else if (stats.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      await copyFiles(srcPath, destPath);
    }
  }));
}

/**
 * Runs custom prebuild actions.
 */
async function prebuild() {
  try {
    let outDir = defaultViteOutDir;
    let destPath = edgeStorageDir;

    const isViteProject = await viteConfigExists();
    if (isViteProject) {
      const config = await readViteConfig();

      if (config?.build?.outDir) {
        outDir = config.build.outDir;
      }

      const srcPath = join('.', outDir);
      destPath = join(edgeStorageDir);

      await mkdir(destPath, { recursive: true });
      await copyFiles(srcPath, destPath);
    }

    const npmArgsForward = packageManager === 'npm' ? '--' : '';

    // support npm, yarn, pnpm
    if (isViteProject) {
      await exec(
        `${packageManager} run build ${npmArgsForward}`,
        'Vue/Vite',
        true,
      );
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
