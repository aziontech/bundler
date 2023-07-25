import { rm, readFile } from 'fs/promises';
import {
  exec, getPackageManager, feedback, copyDirectory,
} from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
async function prebuild(buildContext) {
  try {
    const newOutDir = '.edge/storage';
    let outDir = 'dist';

    // check if an output path is specified in config file
    const configFileContent = await readFile('./astro.config.mjs', 'utf-8');
    const attributeMatch = Array.from(
      configFileContent.matchAll(/outDir:(.*)\n/g),
      (match) => match,
    )[0];
    if (attributeMatch) {
      // get the specified value in config
      outDir = attributeMatch[1].trim();
    }

    await exec(`${packageManager} run build`, 'Astro', true);

    // move files to vulcan default path
    copyDirectory(outDir, newOutDir);
    rm(outDir, { recursive: true, force: true });
  } catch (error) {
    feedback.prebuild.error(error);
  }
}

export default prebuild;
