/* eslint-disable consistent-return */
import fs from 'fs';
import path from 'path';
import PolyfillsManager from '../../../polyfills/polyfills-manager.js';

/**
 * ESBuild Azion Module Plugin for polyfilling node modules.
 * @param {boolean} buildProd Parameter to identify whether the build is dev or prod
 * @returns {object} - ESBuild plugin object.
 */
const ESBuildAzionModulePlugin = (buildProd) => {
  const NAME = 'vulcan-azion-modules-polyfills';
  const NAMESPACE = NAME;
  const filter = /^azion:/;

  return {
    /**
     * Name and setup of the ESBuild plugin.
     * @param {object} build - ESBuild build object.
     */
    name: NAME,
    setup: (build) => {
      const polyfillManager = PolyfillsManager.buildPolyfills();

      const options = build.initialOptions;

      // external
      if (buildProd) {
        options.external = options.external || [];
        [...polyfillManager.external].forEach(([key]) => {
          if (/^[^:]+:/.test(key) && !options.external.includes(key)) {
            options.external.push(key);
          }
        });
      }

      /**
       * Resolve callback for ESBuild.
       * @param {object} args - Arguments object.
       * @returns {object|undefined} - Object with path and namespace or undefined.
       */
      build.onResolve({ filter }, async (args) => {
        if (!buildProd && polyfillManager.external.has(args.path)) {
          return {
            path: args.path,
            namespace: NAMESPACE,
          };
        }
        if (!polyfillManager.external.has(args.path)) {
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
        if (!polyfillManager.external.has(args.path)) {
          return;
        }
        const resolved = polyfillManager.external.get(args.path);
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
