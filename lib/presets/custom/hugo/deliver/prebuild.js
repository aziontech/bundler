import { rm } from 'fs/promises';
import {
  exec,
  getPackageManager,
  copyDirectory,
  generateManifest,
} from '#utils';

const packageManager = await getPackageManager();

const manifest = {
  rules: {
    request: [
      {
        match: '^\\/',
        setOrigin: {
          type: 'object_storage',
        },
      },
      {
        match: '.*/$',
        // eslint-disable-next-line no-template-curly-in-string
        rewrite: '${uri}index.html',
      },
      {
        match: '^(?!.*/$)(?![sS]*.[a-zA-Z0-9]+$).*',
        // eslint-disable-next-line no-template-curly-in-string
        rewrite: '${uri}/index.html',
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
