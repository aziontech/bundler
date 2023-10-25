import fs from 'fs/promises';
import path from 'path';

/**
 * Reads files from a dir (recursively), mount an object with the files contents
 * and generates a code to be used in the worker build process.
 * This files mapping will be available in globalThis.\_\_FILES\_\_(worker memory).
 * You can use fs module to retrieve this files.
 * @param {string[]} dirs - paths of dirs to inject
 * @returns {string} - the code to be injected in bundle process.
 */
async function injectFilesInMem(dirs) {
  const result = {};

  /**
   * Read content from files and save in the result
   * @param {string} dir - dir to read files;
   */
  async function readFilesRecursively(dir) {
    const files = await fs.readdir(dir);

    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          await readFilesRecursively(filePath);
        } else if (stats.isFile()) {
          const bufferContent = await fs.readFile(filePath);
          let key = filePath;
          if (!filePath.startsWith('/')) key = `/${filePath}`;
          const bufferObject = bufferContent.toString('base64');
          result[key] = { content: bufferObject };
        }
      }),
    );
  }

  await Promise.all(
    dirs.map(async (dir) => {
      await readFilesRecursively(dir);
    }),
  );

  const codeToInject = `globalThis.__FILES__=${JSON.stringify(result)};`;

  return codeToInject;
}

export default injectFilesInMem;
