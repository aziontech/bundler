import { readFile, rm } from 'fs/promises';
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
        rewrite: {
          set: (uri) => `${uri}index.html`,
        },
      },
      {
        match: '^(?!.*/$)(?![sS]*.[a-zA-Z0-9]+$).*',
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

  await generateManifest(manifest);

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
