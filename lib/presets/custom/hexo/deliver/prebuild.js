import { readFile, rm } from 'fs/promises';
import { exec, getPackageManager, copyDirectory } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const newOutDir = '.edge/storage';
  let outDir = 'public';

  // check if an output path is specified in config file
  const configFileContent = await readFile('./_config.yml', 'utf-8');
  const attributeMatch = Array.from(
    configFileContent.matchAll(/public_dir:(.*)\n/g),
    (match) => match,
  )[0];
  if (attributeMatch) {
    // get the specified value in config
    outDir = attributeMatch[1].trim().replace(/["']/g, '');
  }

  const command = packageManager === 'npm' ? 'npx' : packageManager;
  await exec(`${command} hexo generate`, 'Hexo', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);
  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
