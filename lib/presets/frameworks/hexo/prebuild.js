import { readFileSync, writeFileSync } from 'fs';
import { exec, feedback, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Overrides static files output path in config file
 * @param {string} path - The new path of the output.
 */
function overrideOutputPath(path) {
  const configFilePath = './_config.yml';

  const fileContent = readFileSync(configFilePath, 'utf-8');
  const newContent = fileContent.replace(/public_dir:.*\n/, `public_dir: ${path}\n`);

  writeFileSync(configFilePath, newContent);
}

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    overrideOutputPath('.edge/statics');
    await exec(`${packageManager} hexo generate`, 'Hexo', true);
  } catch (error) {
    feedback.prebuild.error(error);
  }
}

export default prebuild;
