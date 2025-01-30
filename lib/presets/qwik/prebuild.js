import { access, readFile, rm } from 'fs/promises';
import { exec, getPackageManager, copyDirectory } from '#utils';

const packageManager = await getPackageManager();

/**
 * Checks if a given file exists
 * @param {string} filePath Path of the file to be checked
 * @returns {boolean} Determines whenever the file exists or not
 */
async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const newOutDir = '.edge/storage';
  const adapterConfig = '/adapters/static/vite.config.ts';
  let outDir = 'dist';

  // Check if the project has a custom adapter configuration
  if (await fileExists(adapterConfig)) {
    // Check if an output path is specified in config file
    const configFileContent = await readFile(adapterConfig, 'utf-8');
    const attributeMatch = Array.from(
      configFileContent.matchAll(/outDir:(.*)\n/g),
      (match) => match,
    )[0];

    if (attributeMatch) {
      // Get the specified value from the config file
      outDir = attributeMatch[1].trim();
    }
  }

  // Build the project
  await exec(`${packageManager} run build`, 'Qwik', true);

  // Move files to the bundler path
  copyDirectory(outDir, newOutDir);

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
