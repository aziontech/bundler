import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';

import { Utils } from '#namespaces';

/**
 * @function
 * @memberof Utils
 * @description Checks if a path exists.
 * @param {string} p - The path to check.
 * @returns {Promise<boolean>} A Promise that resolves to `true`
 * if the path exists, `false` otherwise.
 */
async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

const cache = new Map();

/**
 * @function
 * @memberof Utils
 * @description Check if a global package manager (PM) is available.
 * @param {string} pm - The package manager to check (e.g., "npm", "yarn", "pnpm").
 * @returns {Promise<boolean>} A Promise that resolves to true if the global PM is available,
 * false otherwise.
 */
async function hasGlobalInstallation(pm) {
  const key = `has_global_${pm}`;
  if (cache.has(key)) {
    return cache.get(key);
  }

  return new Promise((resolve) => {
    exec(`${pm} --version`, (error, stdout) => {
      if (error) {
        resolve(false);
      } else {
        const isAvailable = /^\d+\.\d+\.\d+$/.test(stdout);
        cache.set(key, isAvailable);
        resolve(isAvailable);
      }
    });
  });
}

/**
 * @function
 * @memberof Utils
 * @description Get the type of lock file (npm, yarn, pnpm) in a specific directory.
 * @param {string} [cwd] - The directory to check. Defaults to the current working directory.
 * @returns {Promise<string|null>} A Promise that resolves to the type of lock file
 * (npm, yarn, pnpm), or null if no lock file is found.
 */
async function getTypeofLockFile(cwd = '.') {
  const key = `lockfile_${cwd}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  const isYarn = await pathExists(path.resolve(cwd, 'yarn.lock'));
  const isNpm = await pathExists(path.resolve(cwd, 'package-lock.json'));
  const isPnpm = await pathExists(path.resolve(cwd, 'pnpm-lock.yaml'));

  let value = null;
  if (isYarn) {
    value = 'yarn';
  } else if (isPnpm) {
    value = 'pnpm';
  } else if (isNpm) {
    value = 'npm';
  }

  cache.set(key, value);
  return value;
}

/**
 * @function
 * @memberof Utils
 * @description Detects the package manager (npm, yarn, pnpm) being used.
 * @param {object} options - Options for detecting the package manager.
 * @param {string} [options.cwd] - The directory to check.
 * Defaults to the current working directory.
 * @returns {Promise<string>} A Promise that resolves to the detected
 *  package manager (npm, yarn, pnpm).
 * @example
 *
 * // Example usage:
 * getPackageManager({ cwd: './my-project' })
 *   .then(pm => console.log(pm)) // Logs: 'yarn', 'npm', or 'pnpm'
 *   .catch(err => console.error(err));
 */
async function getPackageManager({ cwd } = {}) {
  const type = await getTypeofLockFile(cwd);

  if (type) {
    return type;
  }

  const [hasYarn, hasPnpm] = await Promise.all([
    hasGlobalInstallation('yarn'),
    hasGlobalInstallation('pnpm'),
  ]);
  if (hasYarn) {
    return 'yarn';
  }

  if (hasPnpm) {
    return 'pnpm';
  }

  return 'npx';
}

export default getPackageManager;
