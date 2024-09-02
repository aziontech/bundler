import { dirname, join, relative } from 'path';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { feedback } from '#utils';
import { Messages } from '#constants';
import { validateFile, normalizePath } from '../../../utils/fs.js';
import { formatRoutePath, stripIndexRoute } from '../../../utils/routing.js';
import { fixFunctionContent } from '../edge/index.js';
import handlePrerenderedRoutes from '../prerendered/index.js';
import { validationSupportAndRetrieveFromVcConfig } from '../validation/support.js';

/**
 *
 * @param {object} vcConfig object with the content of .vc-config.json
 * @returns {boolean} true if validRuntime, val dEntrypoint
 */
function isVcConfigValid(vcConfig) {
  const isEdge = vcConfig.runtime.match(/edge/) !== null;
  const isNode = vcConfig.runtime.match(/node/) !== null;
  const validRuntime = isEdge || isNode;

  let validEntrypoint = false;
  if (isEdge) {
    validEntrypoint = vcConfig.entrypoint !== undefined;
  } else if (isNode) {
    validEntrypoint = vcConfig.handler !== undefined;
  }

  return validRuntime && validEntrypoint;
}

/**
 * Process the invalid functions and check whether and valid function was created in the functions
 * map to override it.
 *
 * The build output sometimes generates invalid functions at the root, while still creating the
 * valid functions. With the base path and route groups, it might create the valid edge function
 * inside a folder for the route group, but create an invalid one that maps to the same path
 * at the root.
 *
 * When we process the directory, we might add the valid function to the map before we process the
 * invalid one, so we need to check if the invalid one was added to the map and remove it from the
 * set if it was.
 *
 * If the invalid function is an RSC function (e.g. `path.rsc`) and doesn't have a valid squashed
 * version, we check if a squashed non-RSC function exists (e.g. `path`) and use this instead. RSC
 * functions are the same as non-RSC functions, per the Vercel source code.
 * https://github.com/vercel/vercel/blob/main/packages/next/src/server-build.ts#L1193
 * @param {object} functionsMapc Map of path names to function entries.
 * @param {object} functionsMapc.functionsMap Map of path names to function entries.
 * @param {object} functionsMapc.invalidFunctions Set of invalid function paths.
 * @returns {void}
 */
async function tryToFixInvalidFunctions({ functionsMap, invalidFunctions }) {
  if (invalidFunctions.size === 0) {
    return;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const rawPath of invalidFunctions) {
    const formattedPath = formatRoutePath(rawPath);

    if (
      functionsMap.has(formattedPath) ||
      functionsMap.has(stripIndexRoute(formattedPath))
    ) {
      invalidFunctions.delete(rawPath);
    } else if (formattedPath.endsWith('.rsc')) {
      const value = functionsMap.get(formattedPath.replace(/\.rsc$/, ''));

      if (value) {
        functionsMap.set(formattedPath, value);
        invalidFunctions.delete(rawPath);
      }
    }
  }
}

/**
 *
 * @param {object}applicationMapping object with the path to the functions and the functions map
 * @param {string } tmpFunctionsDir path to tmp functions dir
 * @param {object} vcObject object with the content of .vc-config.json
 * @returns {Promise<void>}
 */
// eslint-disable-next-line consistent-return
async function mapAndAdaptFunction(
  applicationMapping,
  tmpFunctionsDir,
  vcObject,
) {
  const functionsDir = join('.vercel', 'output', 'functions');
  const path = vcObject.path.replace('/.vc-config.json', '');

  const { runtime } = vcObject.content;
  const isEdge = runtime.match(/edge/);
  const isNode = runtime.match(/node/);

  if (!isEdge && !isNode) {
    throw new Error('Invalid runtime:', runtime);
  }

  // There are instances where the build output will generate an uncompiled `middleware.js` file that is used as the entrypoint.
  // TODO: investigate when and where the file is generated.
  // This file is not able to be used as it is uncompiled, so we try to instead use the compiled `index.js` if it exists.
  let isMiddleware = false;
  if (vcObject.content.entrypoint === 'middleware.js' && isEdge) {
    isMiddleware = true;
    feedback.prebuild.info('   Founded middleware!');
    // eslint-disable-next-line no-param-reassign
    vcObject.content.entrypoint = 'index';
  }

  const entrypoint = isEdge
    ? vcObject.content.entrypoint
    : vcObject.content.handler;
  const codePath = join(path, entrypoint);
  const relativePath = relative(functionsDir, path);

  if (!(await validateFile(codePath))) {
    if (isMiddleware) {
      // We sometimes encounter an uncompiled `middleware.js` with no compiled `index.js` outside of a base path.
      // Outside the base path, it should not be utilised, so it should be safe to ignore the function.
      feedback.prebuild.info(
        `Detected an invalid middleware function for ${path}. Skipping...`,
      );
      return {};
    }

    applicationMapping.invalidFunctions.add(path);
  }

  const formattedPathName = formatRoutePath(relativePath);
  let newFilePath;
  let newFileContent;

  if (isEdge) {
    newFileContent = fixFunctionContent(readFileSync(codePath, 'utf8'));
    newFilePath = join(tmpFunctionsDir, 'functions', `${relativePath}.js`);
    mkdirSync(dirname(newFilePath), { recursive: true });
    writeFileSync(newFilePath, newFileContent);
  } else {
    // point to global node function that runs the server
    // newFileContent = '() => {}';
    newFilePath = join(tmpFunctionsDir, 'functions', 'azion-node-server.js');
  }

  // TODO: fix wasm imports - Maybe inject wasm? or send to storage?
  // reference: src/buildApplication/generateFunctionsMap.ts -> l392-l451

  // TODO: extract webpack chunks

  const normalizedFilePath = normalizePath(newFilePath);

  applicationMapping.functionsMap.set(formattedPathName, normalizedFilePath);

  if (formattedPathName.endsWith('/index')) {
    // strip `/index` from the path name as the build output config doesn't rewrite `/index` to `/`
    applicationMapping.functionsMap.set(
      stripIndexRoute(formattedPathName),
      normalizedFilePath,
    );
  }
}

// function to walk in builded functions dir, detect invalid functions and adapt content
/**
 *
 * @param {object} applicationMapping object with the path to the functions and the functions map
 * @param {string} tmpFunctionsDir path to tmp functions dir
 * @param {object} vcConfigObjects object with the content of .vc-config.json
 */
// eslint-disable-next-line import/prefer-default-export
export async function mapAndAdaptFunctions(
  applicationMapping,
  tmpFunctionsDir,
  vcConfigObjects,
) {
  // !vcConfigObjects validate support versions and retrieve from .vc-config.json
  let validConfigObjects = vcConfigObjects;
  if (!vcConfigObjects) {
    const {
      vcConfigObjects: resVcConfigObjects,
      valid,
      version,
      runtimes,
    } = await validationSupportAndRetrieveFromVcConfig();
    if (!valid) {
      throw new Error(
        Messages.build.error.prebuild_error_validation_support(
          'Nextjs',
          version,
          runtimes,
        ),
      );
    }
    validConfigObjects = resVcConfigObjects;
  }

  const vcObjects = {
    invalid: validConfigObjects.filter(
      (vcConfig) => !isVcConfigValid(vcConfig.content),
    ),
    valid: validConfigObjects.filter((vcConfig) =>
      isVcConfigValid(vcConfig.content),
    ),
  };

  if (vcObjects.invalid.length > 0) {
    const invalidFunctionsList = vcObjects.invalid
      .filter((invalidFunction) => !invalidFunction.path.includes('_next/data'))
      .map((invalidFunction) =>
        invalidFunction.path.replace(
          /^\.vercel\/output\/functions\/|\.\w+\/\.vc-config\.json$/g,
          '',
        ),
      );
    const invalidFunctionsString = invalidFunctionsList.join('\n');

    throw new Error(`Invalid functions:\n${invalidFunctionsString}`);
  }

  const validVcConfigPaths = vcObjects.valid.map((cfg) => cfg.path);
  await handlePrerenderedRoutes(
    validVcConfigPaths,
    applicationMapping.prerenderedRoutes,
  );

  try {
    await Promise.all(
      vcObjects.valid.map((vcObject) =>
        mapAndAdaptFunction(applicationMapping, tmpFunctionsDir, vcObject),
      ),
    );
  } catch (error) {
    const message = `Error adapting functions: ${error}`;
    feedback.prebuild.error(message);
    throw Error(message);
  }

  await tryToFixInvalidFunctions(applicationMapping);
}
