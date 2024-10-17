/* eslint-disable no-param-reassign,class-methods-use-this */
import fs from 'fs';
import path from 'path';
import { generateWebpackBanner } from '#utils';
import PolyfillsManager from '../../../polyfills/index.js';

class NodePolyfillPlugin {
  constructor(buildProd) {
    this.buildProd = buildProd;
    this.prefix = 'node:';
  }

  apply(compiler) {
    const polyfillsManager = PolyfillsManager.buildPolyfills();

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
      new compiler.webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: polyfillsManager.globals.get('process'),
      }),
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

    compiler.options.plugins.push(
      new compiler.webpack.BannerPlugin({
        banner: generateWebpackBanner([
          polyfillsManager.globals.get('navigator'),
          polyfillsManager.globals.get('performance'),
        ]),
        raw: true,
      }),
    );

    // filter external no prefix
    const filteredExternal = new Map(
      [...polyfillsManager.external].filter(([key]) => {
        const hasPrefix = /^[^:]+:/.test(key);
        return !hasPrefix;
      }),
    );

    if (this.buildProd) {
      compiler.options.externals = compiler.options.externals || {};
      compiler.options.externalsType = 'module';
      compiler.options.externals = {
        ...compiler.options.externals,
        ...Object.fromEntries(
          [...filteredExternal].flatMap(([key]) => {
            return [
              [key, key],
              [`${this.prefix}${key}`, `${this.prefix}${key}`],
            ];
          }),
        ),
      };
    } else {
      compiler.options.resolve.fallback = {
        ...Object.fromEntries(
          [...filteredExternal].map(([key, value]) => [
            key.replace(new RegExp(`^${this.prefix}`), ''),
            value,
          ]),
        ),
        ...compiler.options.resolve.fallback,
      };
    }

    compiler.options.resolve.alias = {
      ...Object.fromEntries(
        [...polyfillsManager.alias].map(([key, value]) => [key, value]),
      ),
      ...compiler.options.resolve.alias,
    };

    compiler.options.resolve.fallback = {
      ...Object.fromEntries(
        [...polyfillsManager.libs].map(([key, value]) => [key, value]),
      ),
      ...compiler.options.resolve.fallback,
    };
  }
}

export default NodePolyfillPlugin;
