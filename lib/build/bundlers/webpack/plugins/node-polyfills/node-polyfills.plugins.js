/* eslint-disable no-param-reassign,class-methods-use-this */
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
    compiler.options.plugins.push(
      new compiler.webpack.EnvironmentPlugin({
        NEXT_RUNTIME: 'edge',
        NEXT_COMPUTE_JS: true,
      }),
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
