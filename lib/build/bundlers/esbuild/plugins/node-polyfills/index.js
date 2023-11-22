/* eslint-disable consistent-return */
import fs from 'fs';
import path from 'path';
import PolyfillsManager from '../../../polyfills/polyfills-manager.js';

const NAME = 'vulcan-node-modules-polyfills';
const NAMESPACE = NAME;

const ESBuildNodeModulePlugin = () => {
  return {
    name: NAME,
    setup: (build) => {
      const polyfilledBuiltins = PolyfillsManager.buildPolyfills();

      // build options
      const options = build.initialOptions;
      options.define = options.define || {};
      if (!options.define?.global) {
        options.define.global = 'globalThis';
      }

      // build inject
      options.inject = options.inject || [];
      if (polyfilledBuiltins.globals) {
        [...polyfilledBuiltins.globals].forEach(([, value]) => {
          options.inject.push(value);
        });
      }

      build.onResolve({ filter: /.*/ }, async (args) => {
        const argsPath = args.path.replace(/^node:/, '');
        if (!polyfilledBuiltins.libs.has(argsPath)) {
          return;
        }

        // alias bypass
        options.alias = options.alias || {};
        if (Object.keys(options.alias).length > 0 && options.alias[argsPath]) {
          return;
        }

        // external bypass
        if (
          options.external.length > 0 &&
          options.external.includes(argsPath)
        ) {
          return;
        }

        return {
          path: args.path,
          namespace: NAMESPACE,
        };
      });

      // assets load
      build.onLoad({ filter: /\.(txt|html)/ }, async (args) => {
        const contents = await fs.promises.readFile(args.path, 'utf8');
        return {
          contents,
          loader: 'text',
        };
      });

      build.onLoad({ filter: /.*/, namespace: NAMESPACE }, async (args) => {
        const argsPath = args.path.replace(/^node:/, '');

        const resolved = polyfilledBuiltins.libs.get(argsPath);
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
