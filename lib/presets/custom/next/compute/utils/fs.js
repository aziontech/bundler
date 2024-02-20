import { readdir, readFile, stat, mkdir, copyFile } from 'fs/promises';
import { resolve, dirname } from 'path';

/**
 * Convert paths with backslashes to normalized paths with forward slashes.
 *
 * Extended-length paths on Windows (starting with \\\\?\\) are not normalized due to
 * exceeding the MAX_PATH (260 characters). They need this prefix so that Windows can
 * identify them as an extended-length path.
 *
 * This is useful when building a project on Windows as the path names in the Next.js
 * build output middleware manifest are in the forward slash format, while Windows
 * uses backslashes.
 * @param {string} path A path with backslashes.
 * @returns {string} A path with forward slashes.
 * @example
 * ```ts
 * const normalized = normalizePath("D:\\path\\with\\backslashes");
 * // normalized === "D:/path/with/backslashes"
 * ```
 */
export function normalizePath(path) {
  return path.startsWith('\\\\?\\') ? path : path.replace(/\\/g, '/');
}

/**
 * Read and parse a JSON file.
 * @param {string}path File path to try and parse as JSON.
 * @returns {JSON} Parsed JSON file.
 */
export async function readJsonFile(path) {
  let parsed = null;
  try {
    const contents = await readFile(path, 'utf8');
    parsed = JSON.parse(contents);
  } catch (e) {
    parsed = null;
  }

  return parsed;
}

/**
 * Check that the path exists and is of the expected type.
 * @param {string} path Path to check.
 * @param {string} type Whether to check for a `file` or `directory`.
 * @returns {boolean} Boolean representing whether the path matched the expected type.
 */
async function validatePathType(path, type) {
  try {
    const stats = await stat(path);
    if (type === 'file' && stats.isFile()) return true;
    if (type === 'directory' && stats.isDirectory()) return true;
  } catch (e) {
    /* empty */
  }

  return false;
}

/**
 * Check that the path exists and that it is a file.
 * @param {string} path Path to check.
 * @returns {boolean} Whether a file exists at the given path.
 */
export function validateFile(path) {
  return validatePathType(path, 'file');
}

/**
 * Check that the path exists and that it is a directory.
 * @param {string} path Path to check.
 * @returns {boolean} Whether a directory exists at the given path.
 */
export function validateDir(path) {
  return validatePathType(path, 'directory');
}

/**
 * Recursively reads all file paths in a directory.
 * @param {string} dir Directory to recursively read from.
 * @returns {Array} Array of all paths for all files in a directory.
 */
export async function readPathsRecursively(dir) {
  try {
    const files = await readdir(dir);
    const paths = await Promise.all(
      files.map(async (file) => {
        const path = resolve(dir, file);

        return (await validateDir(path))
          ? // eslint-disable-next-line no-return-await
            await readPathsRecursively(path)
          : [path];
      }),
    );

    return paths.flat();
  } catch {
    return [];
  }
}

/**
 * Copies a file from one location to another, it also creates the destination
 * directory if it doesn't exist
 * @param {string} sourceFile Original file path.
 * @param {string} destFile Destination for the file.
 */
export async function copyFileWithDir(sourceFile, destFile) {
  await mkdir(dirname(destFile), { recursive: true });
  await copyFile(sourceFile, destFile);
}
