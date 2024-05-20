import { exec, getPackageManager, feedback } from '#utils';
import path from 'path';
import fs from 'fs-extra';

const packageManager = await getPackageManager();

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
