/* eslint-disable */
// Based on https://github.com/remorses/esbuild-plugins/blob/master/node-modules-polyfill/src/index.ts

import escapeStringRegexp from 'escape-string-regexp';
import fs from 'fs';
import path from 'path';

import builtinsPolyfills from './node-polyfills-paths.js';

const NAME = 'node-modules-polyfills';
const NAMESPACE = NAME;

/**
 * Remove ending slash
 * @param {string} importee - the imported path
 * @returns {string} the new path without ending slash
 */
function removeEndingSlash(importee) {
  if (importee && importee.slice(-1) === '/') {
    return importee.slice(0, -1);
  }

  return importee;
}

/**
 * Generates a template for commonjs with module require
 * @param {string} importPath - the import path
 * @returns {string} the template
 */
function commonJsTemplate({ importPath }) {
  return `
const polyfill = require('${importPath}')

if (polyfill && polyfill.default) {
    module.exports = polyfill.default
    for (let k in polyfill) {
        module.exports[k] = polyfill[k]
    }
} else if (polyfill)  {
    module.exports = polyfill
}


`;
}

/**
 * Plugin to use nodejs polyfills
 * @param {object} options - Options to use with the plugin
 * @returns {object} - the plugin
 */
export function NodeModulesPolyfillPlugin(options = {}) {
  const { namespace = NAMESPACE, name = NAME } = options;
  if (namespace.endsWith('commonjs')) {
    throw new Error(`namespace ${namespace} must not end with commonjs`);
  }
  // this namespace is needed to make ES modules expose their default export to require:
  // require('assert') will give you import('assert').default
  const commonjsNamespace = `${namespace}-commonjs`;
  const polyfilledBuiltins = builtinsPolyfills();
  const polyfilledBuiltinsNames = [...polyfilledBuiltins.keys()];

  return {
    name,
    setup: function setup({ onLoad, onResolve, initialOptions }) {
      // polyfills contain global keyword, it must be defined
      if (initialOptions?.define && !initialOptions.define?.global) {
        initialOptions.define.global = 'globalThis';
      } else if (!initialOptions?.define) {
        initialOptions.define = { global: 'globalThis' };
      }

      // TODO these polyfill module cannot import anything, is that ok?
      /**
       *
       * @param args
       */
      async function loader(args) {
        try {
          const argsPath = args.path.replace(/^node:/, '');
          const isCommonjs = args.namespace.endsWith('commonjs');

          const resolved = polyfilledBuiltins.get(removeEndingSlash(argsPath));
          const contents = await (
            await fs.promises.readFile(resolved)
          ).toString();
          const resolveDir = path.dirname(resolved);

          if (isCommonjs) {
            return {
              loader: 'js',
              contents: commonJsTemplate({
                importPath: argsPath,
              }),
              resolveDir,
            };
          }
          return {
            loader: 'js',
            contents,
            resolveDir,
          };
        } catch (e) {
          console.error('node-modules-polyfill', e);
          return {
            contents: 'export {}',
            loader: 'js',
          };
        }
      }
      onLoad({ filter: /.*/, namespace }, loader);
      onLoad({ filter: /.*/, namespace: commonjsNamespace }, loader);
      const filter = new RegExp(
        [
          ...polyfilledBuiltinsNames,
          ...polyfilledBuiltinsNames.map((n) => `node:${n}`),
        ]
          .map(escapeStringRegexp)
          .join('|'), // TODO builtins could end with slash, keep in mind in regex
      );

      async function resolver(args) {
        const argsPath = args.path.replace(/^node:/, '');
        const ignoreRequire = args.namespace === commonjsNamespace;

        if (!polyfilledBuiltins.has(argsPath)) {
          return;
        }

        const isCommonjs = !ignoreRequire && args.kind === 'require-call';

        return {
          namespace: isCommonjs ? commonjsNamespace : namespace,
          path: argsPath,
        };
      }
      onResolve({ filter }, resolver);
      // onResolve({ filter: /.*/, namespace }, resolver)
    },
  };
}

export default NodeModulesPolyfillPlugin;
/* eslint-enable */
