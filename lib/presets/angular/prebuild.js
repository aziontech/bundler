import { exec, getPackageManager } from '#utils';
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
}

export default prebuild;
