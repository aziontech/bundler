import { join } from 'path';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';

import { VercelUtils, feedback, getAbsoluteLibDirPath } from '#utils';
import { mapAndAdaptFunctions } from '../mapping/index.js';
import { assetsPaths } from '../mapping/assets.js';
import { processVercelOutput } from '../mapping/process-mapping.js';

const { loadVercelConfigs } = VercelUtils;

// TODO: generalize or transform to webpack.
// Docs: https://esbuild.github.io/plugins/
const nodeBuiltInModulesPlugin = {
  name: 'node:built-in:modules',
  setup(build) {
    build.onResolve({ filter: /^node:/ }, ({ kind, path }) => {
      // this plugin converts `require("node:*")` calls, those are the only ones that
      // need updating (esm imports to "node:*" are totally valid), so here we tag with the
      // node-buffer namespace only imports that are require calls
      return kind === 'require-call'
        ? {
            path: path.replace('node:', ''),
            namespace: 'node-built-in-modules',
          }
        : undefined;
    });

    // we convert the imports we tagged with the node-built-in-modules namespace so that instead of `require("node:*")`
    // they import from `export * from "node:*";`
    build.onLoad(
      { filter: /.*/, namespace: 'node-built-in-modules' },
      ({ path }) => {
        return {
          contents: `export * from '${path}'`,
          loader: 'js',
        };
      },
    );
  },
};

/**
 * Construct a record for the build output map.
 * @param item The build output item to construct a record for.
 * @returns Record for the build output map.
 */
function constructBuildOutputRecord(item) {
  if (item.type === 'static') {
    return `{ type: ${JSON.stringify(item.type)} }`;
  }

  if (item.type === 'override') {
    return `{
				type: ${JSON.stringify(item.type)},
				path: ${item.path ? JSON.stringify(item.path) : undefined},
				headers: ${item.headers ? JSON.stringify(item.headers) : undefined}
			}`;
  }

  return `{
				type: ${JSON.stringify(item.type)},
				entrypoint: require('${item.entrypoint}')
			}`;
}

/**
 *
 * @param functionsFile
 * @param vercelOutput
 */
function writeOutputReferencesFile(functionsFile, vercelOutput) {
  console.log('writing references file ...');
  try {
    writeFileSync(
      functionsFile,
      `export const __BUILD_OUTPUT__ = {${[...vercelOutput.entries()]
        .map(([name, item]) => `"${name}": ${constructBuildOutputRecord(item)}`)
        .join(',')}};`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 *
 */
async function run() {
  const targetDir = process.cwd();
  //   const workerDir = join(this.targetDir, '.');

  const applicationMapping = {
    invalidFunctions: new Set(),
    functionsMap: new Map(),
    webpackChunks: new Map(),
    wasmIdentifiers: new Map(),
    prerenderedRoutes: new Map(),
  };

  const tmpFunctionsDir = join(tmpdir(), Math.random().toString(36).slice(2));
  //   const dirName = dirname(__filename);

  const config = loadVercelConfigs();

  feedback.prebuild.info('Mapping and transforming functions ...');

  // adapt functions and set application mapping
  await mapAndAdaptFunctions(applicationMapping, tmpFunctionsDir);

  //   if (this.applicationMapping.functionsMap.size <= 0) {
  //       throw new MiddlewareManifestHandlerError("No functions was provided");
  //   }

  const assetsDir = join(targetDir, '.vercel/output/static');
  const assetsManifest = assetsPaths(assetsDir);

  const processedVercelOutput = processVercelOutput(
    config,
    assetsManifest,
    applicationMapping.prerenderedRoutes,
    applicationMapping.functionsMap,
  );

  const outputReferencesFilePath = join(
    tmpdir(),
    `functions-${Math.random().toString(36).slice(2)}.js`,
  );

  writeOutputReferencesFile(
    outputReferencesFilePath,
    processedVercelOutput.vercelOutput,
  );

  return {
    filesToInject: [
      outputReferencesFilePath,
      `${getAbsoluteLibDirPath()}/presets/custom/next/compute/default/routing/libs.js`,
    ],
    globalVars: {
      __CONFIG__: JSON.stringify(processedVercelOutput.vercelConfig),
    },
    plugins: [nodeBuiltInModulesPlugin],
  };
}

export default run;
