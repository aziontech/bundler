import fs from 'fs/promises';

/**
 * Reads the content of a worker file.
 * @async
 * @function
 * @name readWorkerFile
 * @memberof utils
 * @param {string} filePath - The path to the worker file.
 * @returns {Promise<string>} A Promise that resolves to the content of the worker file.
 * @throws {Error} Will throw an error if the file doesn't exist or there was an error reading it.
 * @example
 *
 * // Example usage:
 * readWorkerFile('./worker.js')
 *   .then(content => console.log(content)) // Logs: Content of worker.js
 *   .catch(err => console.error(err)); // Logs: Error message
 */
async function readWorkerFile(filePath) {
  try {
    // Check if the file exists
    await fs.access(filePath);

    // If the file exists, read it and return its contents
    const workerCode = await fs.readFile(filePath, 'utf8');
    return workerCode;
  } catch (error) {
    // If the file does not exist or there was an error reading it, throw a detailed error
    const errorMessage = error.code === 'ENOENT'
      ? 'File does not exist.'
      : `An error occurred while reading the ${filePath} file.`;
    throw new Error(errorMessage);
  }
}

export default readWorkerFile;
