import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * @function
 *
 * @description Removes all temporary files that start with 'azion-' and end with '.temp.js' or '.temp.ts'.
 * @example
 *
 * // Example usage:
 * removeAzionTempFiles();
 * // Removes files like: 'azion-123456.temp.js', 'azion-build.temp.ts'
 */
function removeAzionTempFiles() {
  const directory = process.cwd();
  const tempFiles = readdirSync(directory).filter(
    (file) => file.startsWith('azion-') && (file.endsWith('.temp.js') || file.endsWith('.temp.ts')),
  );

  tempFiles.forEach((file) => {
    const filePath = join(directory, file);
    unlinkSync(filePath);
  });
}

/**
 * @function
 
 * @description Generates a timestamp string in the format "YYYYMMDDHHmmss".
 * @example
 *
 * // Example usage:
 * const timestamp = generateTimestamp();
 * console.log(timestamp); // "20220623123456"
 */
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * @function
 
 * @description Generates a timestamp string in the format "YYYYMMDDHHmmss".
 * @example
 /**
 * @function
 
 * @description Debug method that conditionally logs based on process.env.DEBUG.
 * Inherits all methods from console.log.
 * @description By default, process.env.DEBUG is set to false.
 * When enabled, this method overrides console.log and allows you to log debug messages during
 * development without showing them to the end user. It provides a convenient way to debug your
 * code without the need to manually remove console.log statements.
 * @example
 * // Enable debug mode by setting process.env.DEBUG to true
 * process.env.DEBUG = true;
 *
 * // Log a debug message
 * debug.log('This is a debug message');
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debug: { [key: string]: (...args: any[]) => void } = {};

/**
 * Iterate over the console methods and create corresponding debug methods.
 */
Object.keys(console).forEach((method: string) => {
  if (typeof (console as Console)[method as keyof Console] === 'function') {
    debug[method] = (...args) => {
      if (process.env.DEBUG === 'true') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (console as any)[method](...args);
      }
    };
  }
});

export { removeAzionTempFiles, generateTimestamp, debug };
