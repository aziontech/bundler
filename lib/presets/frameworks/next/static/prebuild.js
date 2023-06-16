import { exec } from '#utils';
import { readdir, stat, rename } from 'fs/promises';
import { join, extname } from 'path';

/**
 * Renames HTML files to index.html recursively in all directories.
 * This is necessary for Next.js projects, where each page file is named after the route path.
 * For example, a file located at 'path/page.js' should be served as 'path.html'.
 * This function renames all HTML files, excluding '404.html',
 * to 'index.html' within the specified directory and its subdirectories.
 * @param {string} directory - The root directory to start renaming files.
 */
async function renameHTMLFiles(directory) {
  const files = await readdir(directory);

  await Promise.all(
    files.map(async (file) => {
      const filePath = join(directory, file);
      const fileStat = await stat(filePath);

      if (fileStat.isDirectory()) {
        await renameHTMLFiles(filePath); // Recursive call for subdirectories
      } else {
        const newFilePath = join(directory, 'index.html');
        if (extname(file) === '.html' && file !== '404.html') {
          await rename(filePath, newFilePath);
          console.log(`Renamed ${filePath} to ${newFilePath}`);
        }
      }
    }),
  );
}

/**
 * Runs custom prebuild actions.
 */
async function prebuild() {
  try {
    console.log('Start Next building...');
    await exec('yarn run build', true);
    console.log('Next build completed.');

    console.log('Renaming HTML files...');
    await renameHTMLFiles(`${process.cwd()}/.edge/statics`);
    console.log('HTML file renaming completed.');
    console.log('Custom prebuild actions completed.');
  } catch (error) {
    console.error(error);
  }
}

export default prebuild;
