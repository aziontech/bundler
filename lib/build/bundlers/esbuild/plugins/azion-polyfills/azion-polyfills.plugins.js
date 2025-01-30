/* eslint-disable consistent-return */
import fs from 'fs';
import path from 'path';
import azionLibs from '../../../helpers/azion-libs.js';

/**
 * ESBuild Azion Module Plugin for polyfilling node modules.
 * @param {boolean} buildProd Parameter to identify whether the build is dev or prod
 * @returns {object} - ESBuild plugin object.
 */
const ESBuildAzionModulePlugin = (buildProd) => {
  const NAME = 'bundler-azion-modules-polyfills';
  const NAMESPACE = NAME;
  const filter = /^azion:/;
  const prefix = 'azion:';

  return {
    /**
     * Name and setup of the ESBuild plugin.
     * @param {object} build - ESBuild build object.
     */
    name: NAME,
    setup: (build) => {
      const options = build.initialOptions;

      // external
      if (buildProd) {
        options.external = options.external || [];
        [...azionLibs.external].forEach(([key]) => {
          if (/^[^:]+:/.test(key) && !options.external.includes(key)) {
            options.external.push(key);
          }
        });
      }

      if (!buildProd) {
        // build inject prefix (azion:) is not present and the polyfill is Azion
        options.inject = options.inject || [];
        if (azionLibs.external) {
          [...azionLibs.external].forEach(([key, value]) => {
            const hasPrefix = /^[^:]+:/.test(key);
            if (
              !hasPrefix &&
              key?.toLowerCase()?.includes(prefix.replace(':', ''))
            ) {
              options.inject.push(value);
            }
          });
        }
      }

      /**
       * Resolve callback for ESBuild.
       * @param {object} args - Arguments object.
       * @returns {object|undefined} - Object with path and namespace or undefined.
       */
      build.onResolve({ filter }, async (args) => {
        if (!buildProd && azionLibs.external.has(args.path)) {
          return {
            path: args.path,
            namespace: NAMESPACE,
          };
        }
        if (!azionLibs.external.has(args.path)) {
          return;
        }

        // external bypass
        if (
          options?.external?.length > 0 &&
          options?.external?.includes(args.path)
        ) {
          return;
        }

        return {
          path: args.path,
          namespace: NAMESPACE,
        };
      });

      /**
       * Load callback for node module files.
       * @param {object} args - Arguments object.
       * @returns {object} - Object with loader, contents, and resolve directory.
       */
      build.onLoad({ filter, namespace: NAMESPACE }, async (args) => {
        if (!azionLibs.external.has(args.path)) {
          return;
        }
        const resolved = azionLibs.external.get(args.path);
        const contents = await fs.promises.readFile(resolved, 'utf8');
        const resolveDir = path.dirname(resolved);

        return {
          loader: 'js',
          contents,
          resolveDir,
        };
      });
    },
  };
};

export default ESBuildAzionModulePlugin;
