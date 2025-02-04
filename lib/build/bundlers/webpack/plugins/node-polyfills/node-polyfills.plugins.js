/* eslint-disable no-param-reassign,class-methods-use-this */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { env, nodeless } from 'unenv';
import { getAbsoluteLibDirPath } from '#utils';
import unenvPresetAzion from 'azion/unenv-preset';

const require = createRequire(import.meta.url);

const INTERNAL_POLYFILL_PATH = `${getAbsoluteLibDirPath()}/env/polyfills`;
const INTERNAL_POLYFILL_PATH_PROD = `azion/unenv-preset/src/polyfills/node`;
const POLYFILL_PREFIX_DEV = 'aziondev:';
const POLYFILL_PREFIX_PROD = 'azionprd:';

const { alias, inject, polyfill, external } = env(nodeless, unenvPresetAzion);

class NodePolyfillPlugin {
  constructor(buildProd) {
    this.buildProd = buildProd;
    this.prefix = 'node:';
  }

  #changeToPolyfillPath = (key, value, polyfillPrefix, polyfillPath) => {
    const keyModule = key.replace(new RegExp(`^${this.prefix}`), '');
    const foundPolyfill = polyfill.find((p) =>
      p.startsWith(`${polyfillPrefix}${keyModule}`),
    );
    if (foundPolyfill) {
      const [, , pathPolyfill] = foundPolyfill.split(':');
      const internalPolyfillsPath = path.join(polyfillPath, pathPolyfill);
      const resolved = require.resolve(internalPolyfillsPath);
      return [key, resolved];
    }
    return [key, require.resolve(value)];
  };

  apply(compiler) {
    if (!compiler.options.plugins?.length) {
      compiler.options.plugins = [];
    }

    // additional plugin to handle "node:" URIs
    compiler.options.plugins.push(
      new compiler.webpack.NormalModuleReplacementPlugin(
        new RegExp(`^${this.prefix}`),
        (resource) => {
          const mod = resource.request.replace(
            new RegExp(`^${this.prefix}`),
            '',
          );
          resource.request = mod;
        },
      ),
    );

    // globals
    compiler.options.plugins.push(
      new compiler.webpack.ProvidePlugin(
        Object.fromEntries(
          Object.entries(inject).map(([key, value]) => {
            if (typeof value === 'string') {
              return [key, require.resolve(value)];
            }
            return [key, value];
          }),
        ),
      ),
    );

    // env
    const envsNext = {
      NODE_ENV: 'production',
    };
    if (fs.existsSync(path.join(process.cwd(), '.next'))) {
      const buildId = fs.readFileSync(
        path.join(process.cwd(), '.next/BUILD_ID'),
        'utf-8',
      );
      envsNext.NEXT_RUNTIME = 'edge';
      envsNext.NEXT_COMPUTE_JS = true;
      // eslint-disable-next-line no-underscore-dangle
      envsNext.__NEXT_BUILD_ID = buildId;
    }

    compiler.options.plugins.push(
      new compiler.webpack.EnvironmentPlugin(envsNext),
    );

    if (this.buildProd) {
      compiler.options.externals = compiler.options.externals || {};
      compiler.options.externalsType = 'module';
      compiler.options.externals = {
        ...compiler.options.externals,
        ...Object.fromEntries(
          [...external].flatMap((key) => {
            const moduleName = key.replace(new RegExp(`^${this.prefix}`), '');
            return [
              [key, key],
              [moduleName, moduleName],
            ];
          }),
        ),
      };
    }

    compiler.options.resolve.alias = {
      ...compiler.options.resolve.alias,
      ...alias,
    };

    compiler.options.resolve.fallback = {
      ...compiler.options.resolve.fallback,
      ...alias,
    };

    // change alias and fallback to polyfill path
    if (this.buildProd) {
      compiler.options.resolve.alias = {
        ...Object.fromEntries(
          Object.entries(compiler.options.resolve.alias).map(([key, value]) => {
            // change value to polyfill path
            return this.#changeToPolyfillPath(
              key,
              value,
              POLYFILL_PREFIX_PROD,
              INTERNAL_POLYFILL_PATH_PROD,
            );
          }),
        ),
      };
      compiler.options.resolve.fallback = {
        ...Object.fromEntries(
          Object.entries(compiler.options.resolve.fallback).map(
            ([key, value]) => {
              // change value to polyfill path
              return this.#changeToPolyfillPath(
                key,
                value,
                POLYFILL_PREFIX_PROD,
                INTERNAL_POLYFILL_PATH_PROD,
              );
            },
          ),
        ),
      };
    } else {
      compiler.options.resolve.alias = {
        ...Object.fromEntries(
          Object.entries(compiler.options.resolve.alias).map(([key, value]) => {
            // change value to polyfill path
            return this.#changeToPolyfillPath(
              key,
              value,
              POLYFILL_PREFIX_DEV,
              INTERNAL_POLYFILL_PATH,
            );
          }),
        ),
      };
      compiler.options.resolve.fallback = {
        ...Object.fromEntries(
          Object.entries(compiler.options.resolve.fallback).map(
            ([key, value]) => {
              // change value to polyfill path
              return this.#changeToPolyfillPath(
                key,
                value,
                POLYFILL_PREFIX_DEV,
                INTERNAL_POLYFILL_PATH,
              );
            },
          ),
        ),
      };
    }
  }
}

export default NodePolyfillPlugin;
