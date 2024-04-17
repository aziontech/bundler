import { rm } from 'fs/promises';
import {
  exec,
  getPackageManager,
  copyDirectory,
  generateManifest,
} from '#utils';

const packageManager = await getPackageManager();

// Bucket name cannot repeat, so we should use a non-repeatable value, such as timestamp
// CLI will use origin name for Bucket name is the value "bucket" is not sent
const currentTime = Date.now();

const manifest = {
  origin: [
    {
      name: 'origin-storage-default-' + currentTime,
      type: 'object_storage',
    },
  ],
  rules: {
    request: [
      {
        name: 'Main_Rule',
        match: '^\\/',
        setOrigin: {
          name: 'origin-storage-default-' + currentTime,
          type: 'object_storage',
        },
      },
      {
        name: 'Index_Rewrite_1',
        match: '.*/$',
        // eslint-disable-next-line no-template-curly-in-string
        rewrite: {
          set: (uri) => `${uri}index.html`,
        },
      },
      {
        name: 'Index_Rewrite_2',
        match: '^(?!.*\/$)(?![\s\S]*\.[a-zA-Z0-9]+$).*',
        // eslint-disable-next-line no-template-curly-in-string
        rewrite: {
          set: (uri) => `${uri}index.html`,
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
  const outDir = 'public';

  const command = packageManager === 'npm' ? 'npx' : packageManager;
  await exec(`${command} hugo`, 'Hugo', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);

  await generateManifest(manifest);

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
