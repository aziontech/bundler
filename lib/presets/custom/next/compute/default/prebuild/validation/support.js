import { coerce, valid } from 'semver';
import glob from 'fast-glob';
import { readFileSync } from 'fs';
import { getNextProjectConfig, isLocalePath } from '../../../utils/next.js';
import VERSION_RUNTIME_MAP_SUPPORT from './supported-versions.js';

/**
 * Validates the support of a given version and runtimes.
 * @param {string} version - The version to validate.
 * @param {string[]} runtimes - The runtimes to validate.
 * @param {string} framework - The framework to validate. Defaults to 'nextjs'.
 * @returns {object} An object containing the validation result, the version, the runtimes, and the minor version.
 */
export function validateSupport(version, runtimes, framework = 'nextjs') {
  const validVersion = valid(coerce(version));
  const versionWithFramework = `${framework}-${validVersion}`;
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
 * Modifies the Vercel configuration objects based on the provided framework.
 * If the framework is 'nextjs', it ignores i18n paths in runtime detection and removes unnecessary node generated functions for i18n.
 * @param {string} framework - The framework to modify the Vercel configuration objects for.
 * @param {Array<object>} vcConfigObjects - The Vercel configuration objects to modify.
 * @returns {Promise<Array<object>>} Returns a promise that resolves to the modified Vercel configuration objects.
 * @async
 */
async function modifyVcConfigObjects(framework, vcConfigObjects) {
  let filteredVcConfigObjects = vcConfigObjects;
  if (framework === 'nextjs') {
    // ignore i18n paths in runtime detection
    // unnecessary node generated functions for i18n.
    const nextProjectConfig = await getNextProjectConfig();
    const locales = nextProjectConfig?.i18n?.locales || [];
    filteredVcConfigObjects = vcConfigObjects.filter(
      (config) => !isLocalePath(config.path, locales),
    );
  }
  return Promise.resolve(filteredVcConfigObjects);
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

  return vcConfigObjects;
}

/**
 * Validates support and retrieves configuration from Vercel configuration files.
 * @param {string} path - The path where the configuration files are located. Defaults to '.vercel\/output\/functions\/**\/.vc-config.json'.
 * @param {string} framework - The framework to validate. Defaults to 'nextjs'.
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
  framework = 'nextjs',
) {
  let vcConfigObjects = await readVcConfigFunctions(path);

  if (!vcConfigObjects.length)
    throw new Error('No .vc-config.json files found');

  vcConfigObjects = await modifyVcConfigObjects(framework, vcConfigObjects);

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
    ...validateSupport(version, runtimes, framework),
  });
}
