import fs from 'fs/promises';
import { Messages } from '#constants';
/**
 * Load code from the specified file.
 * @param {string} filePath - The path to the file containing the code.
 * @throws {Error} If the file does not exist or there was an error reading the file.
 * @returns {Promise<string>} A Promise that resolves with the loaded code.
 */
async function readWorkerFile(filePath) {
  const fileExists = await fs.access(filePath).then(() => true).catch(() => false);

  if (!fileExists) {
    throw new Error(Messages.errors.file_doesnt_exist(filePath));
  }

  const workerCode = await fs.readFile(filePath, 'utf8');
  return workerCode;
}

export default readWorkerFile;
