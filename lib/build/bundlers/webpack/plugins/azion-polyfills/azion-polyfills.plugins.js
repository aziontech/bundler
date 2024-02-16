/* eslint-disable no-param-reassign,class-methods-use-this */
import PolyfillsManager from '../../../polyfills/index.js';

class AzionPolyfillPlugin {
  constructor(buildProd) {
    this.buildProd = buildProd;
    this.prefix = 'azion:';
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

    const filteredExternal = new Map(
      [...polyfillsManager.external].filter(([key]) => {
        const hasPrefix = new RegExp(`^${this.prefix}`).test(key);
        return hasPrefix;
      }),
    );

    if (this.buildProd) {
      compiler.options.externals = compiler.options.externals || {};
      compiler.options.externalsType = 'module';
      compiler.options.externals = {
        ...Object.fromEntries(
          [...filteredExternal].flatMap(([key]) => {
            return [
              [key, key],
              [`${this.prefix}${key}`, `${this.prefix}${key}`],
            ];
          }),
        ),
        ...compiler.options.externals,
      };
    } else {
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
  }
}

export default AzionPolyfillPlugin;
