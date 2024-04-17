import { exec, getPackageManager, generateManifest, feedback } from '#utils';
import path from 'path';
import fs from 'fs-extra';

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
  // This is because npm interprets arguments passed directly
  // after the script as options for npm itself, not the script itself.
  const npmArgsForward = packageManager === 'npm' ? '--' : '';
  // support npm, yarn, pnpm
  await exec(
    `${packageManager} run build ${npmArgsForward} --output-path=.edge/storage`,
    'Angular',
    true,
  );

  await generateManifest(manifest);

  // Move the contents of the 'Browser' folder, which contains static files, to the root of the storage.
  const browserFolder = path.join(process.cwd(), '.edge', 'storage', 'browser');
  if (fs.existsSync(browserFolder)) {
    const newPath = path.join(process.cwd(), '.edge', 'storage');

    const files = await fs.readdir(browserFolder);
    await Promise.all(
      files.map(async (file) => {
        await fs.move(path.join(browserFolder, file), path.join(newPath, file));
      }),
    );

    // Remove the original folder
    await fs.remove(browserFolder);
  }

  // If the folder exists, it means that the application is using server-side rendering (SSR)
  // functionalities. In this case, a warning message is logged.
  const serverFolderPath = path.join(
    process.cwd(),
    '.edge',
    'storage',
    'server',
  );
  if (fs.existsSync(serverFolderPath)) {
    feedback.prebuild.warn(
      `It looks like you are using SSR functionalities. Server-side functionality will not work in 'deliver' mode.`,
    );
  }
}

export default prebuild;
