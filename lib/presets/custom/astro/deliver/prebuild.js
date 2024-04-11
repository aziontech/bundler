import { rm, readFile } from 'fs/promises';
import {
  exec,
  getPackageManager,
  copyDirectory,
  generateManifest,
} from '#utils';

const packageManager = await getPackageManager();

const manifest = {
  origin: [
    {
      name: 'origin_storage_default',
      type: 'object_storage',
    },
  ],
  rules: {
    request: [
      {
        name: 'Main_Rule',
        match: '^\\/',
        setOrigin: {
          name: 'origin_storage_default',
          type: 'object_storage',
        },
      },
    ],
  },
};

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
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

  await generateManifest(manifest);

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
