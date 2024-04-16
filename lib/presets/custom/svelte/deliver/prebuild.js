import { rm } from 'fs/promises';
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
  const outDir = 'build';

  await exec(`${packageManager} run build`, 'Svelte', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);

  await generateManifest(manifest);

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
