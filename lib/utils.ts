import { unlinkSync } from 'fs';
import { join } from 'path';
import { readFile, writeFile, access } from 'fs/promises';
import { constants } from 'fs';
import { DIRECTORIES } from '#constants';
import { readStore, writeStore } from '#env';

/**
 * @function markForCleanup
 *
 * @description Marks a file for automatic cleanup by storing its path in the global bundler store.
 * Files marked with this function will be automatically removed when the bundler process exits
 * or when cleanup operations are executed.
 *
 * **How it works:**
 * - Adds the file path to `store.tempFiles[]` array in the global store
 * - Store persists in `.azion-bundler.json` in the temporary directory
 * - Files are cleaned up by `removeAzionTempFiles()` during process exit or manual cleanup
 *
 * **Use cases:**
 * - Mark temporary build artifacts for cleanup
 * - Track generated files that should not persist between builds
 * - Ensure temporary files are cleaned up even if process crashes
 *
 * **Safety:**
 * - Fails silently to avoid breaking the build process
 * - Only tracks unique file paths (no duplicates)
 * - Does not immediately delete files, only marks them for later cleanup
 *
 * @param filePath - Absolute path to the file that should be cleaned up later
 *
 * @example
 * ```typescript
 * // Mark a temporary build file for cleanup
 * await markForCleanup('/tmp/azion-worker-123.temp.js');
 *
 * // Files will be automatically cleaned up when:
 * // 1. Process exits normally
 * // 2. Process receives SIGINT/SIGTERM
 * // 3. removeAzionTempFiles() is called manually
 * ```
 */
async function markForCleanup(filePath: string): Promise<void> {
  try {
    const store = await readStore();
    const tempFiles = store.tempFiles || [];

    if (!tempFiles.includes(filePath)) {
      tempFiles.push(filePath);
      await writeStore({ ...store, tempFiles });
    }
  } catch (error) {
    // Silently fail - temp file registration shouldn't break the build
    debug.warn('Failed to register temp file:', filePath);
  }
}

/**
 * @function executeCleanup
 *
 * @description Executes cleanup of all temporary files that were marked using markForCleanup().
 * Only removes files that were explicitly marked during the build process, ensuring safe cleanup.
 *
 * **How it works:**
 * - Reads the `tempFiles[]` array from the global bundler store
 * - Attempts to delete each file in the list
 * - Clears the tempFiles list from store after cleanup
 * - Fails silently on individual file errors to prevent build interruption
 *
 * **When it's called:**
 * - Automatically during process exit (SIGINT, SIGTERM, etc.)
 * - Manually at the end of build process
 * - Via `azion store destroy` command
 *
 * @example
 * ```typescript
 * // Execute cleanup of all marked files
 * await executeCleanup();
 *
 * // This will remove all files previously marked with:
 * // await markForCleanup('/path/to/temp/file.js');
 * ```
 */
async function executeCleanup(): Promise<void> {
  try {
    const store = await readStore('global');
    const tempFiles = store.tempFiles || [];

    tempFiles.forEach((filePath) => {
      try {
        unlinkSync(filePath);
      } catch (error) {
        debug.warn('Failed to remove temp file:', filePath);
      }
    });
    await writeStore({ ...store, tempFiles: [] });
  } catch (error) {
    debug.warn('Failed to clean temp files from store:', error);
  }
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

/**
 * @function
 * @description Copies the .env file from the project root to the .edge directory.
 * Following Node.js native .env support pattern.
 * @example
 *
 * // Example usage:
 * await copyEnvToEdge();
 * // Copies .env to .edge/.env if it exists
 */
async function copyEnvVars(): Promise<void> {
  const cwd = process.cwd();
  const envPath = join(cwd, '.env');
  const edgeEnvPath = DIRECTORIES.OUTPUT_ENV_VARS_PATH;

  try {
    const exists = await access(envPath, constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      const envContent = await readFile(envPath, 'utf-8');
      await writeFile(edgeEnvPath, envContent, 'utf-8');
      debug.info(`Environment file copied to ${edgeEnvPath}`);
    }
  } catch (error) {
    debug.warn('No .env file found or error copying environment file');
  }
}

export { executeCleanup, generateTimestamp, debug, copyEnvVars, markForCleanup };
