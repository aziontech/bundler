import { coerce, valid } from 'semver';
import glob from 'fast-glob';
import { readFileSync } from 'fs';
import { getNextProjectConfig, isLocalePath } from '../../../utils/next.js';

/**
 * A map that associates Next.js versions with their supported runtimes.
 * @type {Map<string, string[]>}
 */
const VERSION_RUNTIME_MAP_SUPPORT = new Map([
  ['nextjs-12.3.1', ['node', 'edge']],
  ['nextjs-12.3.2', ['node', 'edge']],
  ['nextjs-12.3.3', ['node', 'edge']],
  ['nextjs-12.3.4', ['node', 'edge']],
  ['nextjs-13.0.0', ['edge']],
  ['nextjs-13.4.8', ['edge']],
  ['nextjs-13.5.6', ['edge']],
]);

/**
 * Validates the support of a given version and runtimes.
 * @param {string} version - The version to validate.
 * @param {string[]} runtimes - The runtimes to validate.
 * @returns {object} An object containing the validation result, the version, the runtimes, and the minor version.
 */
export function validateSupport(version, runtimes) {
  const validVersion = valid(coerce(version));
  const versionWithFramework = `nextjs-${validVersion}`;
  const minorVersion = `${validVersion.split('.').slice(0, 2).join('.')}.x`;
  if (VERSION_RUNTIME_MAP_SUPPORT.has(versionWithFramework)) {
    const allowedRuntimes =
      VERSION_RUNTIME_MAP_SUPPORT.get(versionWithFramework);
    if (allowedRuntimes.some((runtime) => runtimes.includes(runtime))) {
      return { valid: true, version: validVersion, runtimes, minorVersion };
    }
    return { valid: false, version: validVersion, runtimes, minorVersion };
  }
  return { valid: false, version: validVersion, runtimes, minorVersion };
}

/**
 * Reads the Vercel configuration files (vc-config.json) for specific functions.
 * @param {string} path - The path where the configuration files are located. Defaults to '.vercel\/output\/functions\/**\/.vc-config.json'.
 * @returns {Promise<Array<object>>} Returns a promise that resolves to a list of objects. Each object contains the configuration file path and the configuration file content.
 * @async
 */
async function readVcConfigFunctions(
  path = '.vercel/output/functions/**/.vc-config.json',
) {
  const vcConfigPaths = glob.sync(path);
  const vcConfigObjects = vcConfigPaths.map((file) => ({
    path: file,
    content: JSON.parse(readFileSync(file, 'utf8')),
  }));

  // ignore i18n paths in runtime detection
  // unnecessary node generated functions for i18n.
  const nextProjectConfig = await getNextProjectConfig();
  const locales = nextProjectConfig?.i18n?.locales || [];
  const filteredVcConfigObjects = vcConfigObjects.filter(
    (config) => !isLocalePath(config.path, locales),
  );

  return filteredVcConfigObjects;
}

/**
 * Validates support and retrieves configuration from Vercel configuration files.
 * @param {string} path - The path where the configuration files are located. Defaults to '.vercel\/output\/functions\/**\/.vc-config.json'.
 * @returns {Promise<object>} Returns a promise that resolves to an object. The object contains the Vercel configuration objects, the validation status, and the runtime environments.
 * @example
 *  const {
 *    vcConfigObjects,
 *    valid,
 *    version,
 *    runtimes,
 *    minorVersion
 *  } = await validationSupportAndRetrieveFromVcConfig();
 * @async
 */
export async function validationSupportAndRetrieveFromVcConfig(
  path = '.vercel/output/functions/**/.vc-config.json',
) {
  const vcConfigObjects = await readVcConfigFunctions(path);
  if (!vcConfigObjects.length)
    throw new Error('No .vc-config.json files found');
  const runtimesConfig = [
    ...new Set(vcConfigObjects.map((config) => config.content.runtime)),
  ];

  // runtimesConfig [ 'nodejs18.x', 'edge' ]
  let runtimes = ['edge'];
  const isNode = runtimesConfig.some((runtime) => runtime.startsWith('node'));
  if (isNode && runtimesConfig.includes('edge')) {
    runtimes = ['node', 'edge'];
  } else if (isNode) {
    runtimes = ['node'];
  }
  const version = vcConfigObjects[0].content?.framework?.version;
  return Promise.resolve({
    vcConfigObjects,
    ...validateSupport(version, runtimes),
  });
}
