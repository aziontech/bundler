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
  const minorVersion = `${validVersion.split('.').slice(0, 2).join('.')}.x`;
  const versionWithFramework = `${framework}-${validVersion}`;
  const versionMinorWithFramework = `${framework}-${minorVersion}`;

  // allowed runtimes for the given version
  const getAllowedRuntimes = (currentVersion) => {
    let allowed = false;
    const allowedRuntimes = VERSION_RUNTIME_MAP_SUPPORT.get(currentVersion);
    if (allowedRuntimes.some((runtime) => runtimes.includes(runtime))) {
      if (!runtimes.every((runtime) => allowedRuntimes.includes(runtime))) {
        return allowed;
      }
      allowed = true;
    }
    return allowed;
  };

  const result = {
    valid: false,
    version: validVersion,
    runtimes,
    minorVersion,
  };
  // check if the path version e.g 12.3.1
  if (VERSION_RUNTIME_MAP_SUPPORT.has(versionWithFramework)) {
    result.valid = getAllowedRuntimes(versionWithFramework);
  }
  // check if the minor version e.g 12.3.x
  else if (VERSION_RUNTIME_MAP_SUPPORT.has(versionMinorWithFramework)) {
    result.valid = getAllowedRuntimes(versionMinorWithFramework);
  }

  return result;
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
  const buildedFunctionsPath = '.vercel/output/functions';
  const pathsToIgnore = [
    `${buildedFunctionsPath}/favicon.ico.func/.vc-config.json`,
    `${buildedFunctionsPath}/_not-found.func/.vc-config.json`,
    `${buildedFunctionsPath}/_not-found.rsc.func/.vc-config.json`,
  ];

  const vcConfigPaths = glob.sync(path, { ignore: pathsToIgnore });
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

  console.log('##### vcConfigObjects - 1  \n', vcConfigObjects);

  if (!vcConfigObjects.length)
    throw new Error('No .vc-config.json files found');

  vcConfigObjects = await modifyVcConfigObjects(framework, vcConfigObjects);
  console.log('##### vcConfigObjects - 2 \n', vcConfigObjects);
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
  const versions = vcConfigObjects
    .map((config) => config.content?.framework?.version)
    .filter(Boolean);
  const version = versions.length > 0 ? versions[0] : null;
  if (!version)
    Promise.reject(new Error('No framework version found in .vc-config.json'));
  return Promise.resolve({
    vcConfigObjects,
    ...validateSupport(version, runtimes, framework),
  });
}
