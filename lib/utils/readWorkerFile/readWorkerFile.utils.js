import fs from 'fs/promises';

/**
 * Load code from the specified file.
 * @param {string} filePath - The path to the file containing the code.
 * @throws {Error} If the file does not exist or there was an error reading the file.
 * @returns {Promise<string>} A Promise that resolves with the loaded code.
 */
async function readWorkerFile(filePath) {
  try {
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);

    if (!fileExists) {
      throw new Error('Your application entrypoint could not be located.');
    }

    const workerCode = await fs.readFile(filePath, 'utf8');
    return workerCode;
  } catch (error) {
    feedback.error('Failed to read worker file:', error);
    throw error;
  }
}

export default readWorkerFile;
