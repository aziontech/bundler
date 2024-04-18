import {
  exec,
  getPackageManager,
  copyDirectory,
  generateManifest,
} from '#utils';
import { lstat, readFile, rm } from 'fs/promises';

const packageManager = await getPackageManager();
const edgeStorageDir = '.edge/storage';
const defaultViteOutDir = 'dist';

const manifest = {
  origin: [
    {
      name: 'origin-storage-default',
      type: 'object_storage',
    },
  ],
  rules: {
    request: [
      {
        name: 'Main_Rule',
        match: '^\\/',
        setOrigin: {
          name: 'origin-storage-default',
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
        match: '^(?!.*\\/$)(?![\\s\\S]*\\.[a-zA-Z0-9]+$).*',
        // eslint-disable-next-line no-template-curly-in-string
        rewrite: {
          set: (uri) => `${uri}index.html`,
        },
      },
    ],
  },
};

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
 * Runs custom prebuild actions.
 */
async function prebuild() {
  const npmArgsForward = packageManager === 'npm' ? '--' : '';

  let outDir = defaultViteOutDir;
  const destPath = edgeStorageDir;

  const isViteProject = await viteConfigExists();

  if (isViteProject) {
    await exec(
      `${packageManager} run build ${npmArgsForward}`,
      'Vue/Vite',
      true,
    );

    const config = await readViteConfig();

    if (config?.build?.outDir) {
      outDir = config.build.outDir;
    }

    copyDirectory(outDir, destPath);
    rm(outDir, { recursive: true, force: true });
  }

  if (!isViteProject) {
    await exec(
      `${packageManager} run build ${npmArgsForward} --dest ${destPath}`,
      'Vue',
      true,
    );
  }

  await generateManifest(manifest);
}

export default prebuild;
