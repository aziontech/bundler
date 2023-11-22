/* eslint-disable consistent-return */
import fs from 'fs';
import path from 'path';
import PolyfillsManager from '../../../polyfills/polyfills-manager.js';

/**
 * ESBuild Node Module Plugin for polyfilling node modules.
 * @returns {object} - ESBuild plugin object.
 */
const ESBuildNodeModulePlugin = () => {
  const NAME = 'vulcan-node-modules-polyfills';
  const NAMESPACE = NAME;

  return {
    /**
     * Name and setup of the ESBuild plugin.
     * @param {object} build - ESBuild build object.
     */
    name: NAME,
    setup: (build) => {
      const polyfillManager = PolyfillsManager.buildPolyfills();

      // build options
      const options = build.initialOptions;
      options.define = options.define || {};
      if (!options.define?.global) {
        options.define.global = 'globalThis';
      }

      // build inject
      options.inject = options.inject || [];
      if (polyfillManager.globals) {
        [...polyfillManager.globals].forEach(([, value]) => {
          options.inject.push(value);
        });
      }

      /**
       * Resolve callback for ESBuild.
       * @param {object} args - Arguments object.
       * @returns {object|undefined} - Object with path and namespace or undefined.
       */
      build.onResolve({ filter: /.*/ }, async (args) => {
        const argsPath = args.path.replace(/^node:/, '');
        if (!polyfillManager.libs.has(argsPath)) {
          return;
        }

        // alias bypass
        options.alias = options.alias || {};
        if (
          Object.keys(options.alias)?.length > 0 &&
          options?.alias[argsPath]
        ) {
          return;
        }

        // external bypass
        if (
          options?.external?.length > 0 &&
          options?.external?.includes(argsPath)
        ) {
          return;
        }

        return {
          path: args.path,
          namespace: NAMESPACE,
        };
      });

      /**
       * Load callback for assets.
       * @param {object} args - Arguments object.
       * @returns {object} - Object with contents and loader type.
       */
      build.onLoad({ filter: /\.(txt|html)/ }, async (args) => {
        const contents = await fs.promises.readFile(args.path, 'utf8');
        return {
          contents,
          loader: 'text',
        };
      });

      /**
       * Load callback for node module files.
       * @param {object} args - Arguments object.
       * @returns {object} - Object with loader, contents, and resolve directory.
       */
      build.onLoad({ filter: /.*/, namespace: NAMESPACE }, async (args) => {
        const argsPath = args.path.replace(/^node:/, '');

        const resolved = polyfillManager.libs.get(argsPath);
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

export default ESBuildNodeModulePlugin;
