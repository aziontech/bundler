import fs from 'fs/promises';

/**
 * @function
 
 * @description Reads the content of a worker file.
 * @example
 *
 * // Example usage:
 * readWorkerFile('./worker.js')
 *   .then(content => console.log(content)) // Logs: Content of worker.js
 *   .catch(err => console.error(err)); // Logs: Error message
 */
async function readWorkerFile(filePath: string): Promise<string> {
  try {
    // Check if the file exists
    await fs.access(filePath);

    // If the file exists, read it and return its contents
    const workerCode = await fs.readFile(filePath, 'utf8');
    return workerCode;
  } catch (error) {
    // If the file does not exist or there was an error reading it, throw a detailed error
    const errorMessage = (error as Error).message.includes('ENOENT')
      ? 'File does not exist.'
      : `An error occurred while reading the ${filePath} file.`;
    throw new Error(errorMessage);
  }
}

export default readWorkerFile;
