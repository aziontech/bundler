/* eslint-disable no-param-reassign */
import escapeStringRegexp from 'escape-string-regexp';
import fs from 'fs';
import path from 'path';

import builtinsPolyfills from '../../../polyfills/node-polyfills-paths.js';

const NAME = 'vulcan-node-modules-polyfills';
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
  const polyfilledBuiltinsNames = [...polyfilledBuiltins.libs.keys()];

  return {
    name,
    setup: function setup({ onLoad, onResolve, initialOptions }) {
      // polyfills contain global keyword, it must be defined
      if (initialOptions?.define && !initialOptions.define?.global) {
        initialOptions.define.global = 'globalThis';
      } else if (!initialOptions?.define) {
        initialOptions.define = {
          global: 'globalThis',
        };
      }
      if (initialOptions.external && initialOptions.external.length > 0) {
        const changedExternal = initialOptions.external.reduce(
          (acc, current) => {
            if (polyfilledBuiltinsNames.includes(current)) {
              acc[`node:${current}`] = current;
            }
            acc[current] = current;
            return acc;
          },
          {},
        );
        initialOptions.external = Object.keys(changedExternal);
      }
      initialOptions.inject = initialOptions.inject || [];

      if (polyfilledBuiltins.globals) {
        [...polyfilledBuiltins.globals].forEach(([, value]) => {
          initialOptions.inject.push(value);
        });
      }

      /**
       *
       * @param args
       */
      async function loader(args) {
        try {
          const argsPath = args.path.replace(/^node:/, '');
          const isCommonjs = args.namespace.endsWith('commonjs');

          const resolved = polyfilledBuiltins.libs.get(
            removeEndingSlash(argsPath),
          );
          const contents = await (
            await fs.promises.readFile(resolved)
          ).toString();
          const resolveDir = path.dirname(resolved);

          const modifiedContents = contents.replace(/node:/g, '');

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
            contents: modifiedContents,
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

      /**
       *
       * @param args
       */
      async function resolver(args) {
        const argsPath = args.path.replace(/^node:/, '');
        const ignoreRequire = args.namespace === commonjsNamespace;
        const isCommonjs = !ignoreRequire && args.kind === 'require-call';

        if (!polyfilledBuiltins.libs.has(argsPath)) {
          return;
        }

        if (
          initialOptions.external &&
          initialOptions.external.includes(args.path)
        ) {
          return;
        }

        // eslint-disable-next-line consistent-return
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
