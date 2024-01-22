/* eslint-disable no-param-reassign,class-methods-use-this */
import { generateWebpackBanner } from '#utils';
import PolyfillsManager from '../../../polyfills/polyfills-manager.js';

class NodePolyfillPlugin {
  constructor(buildProd) {
    this.buildProd = buildProd;
  }

  apply(compiler) {
    const polyfillsManager = PolyfillsManager.buildPolyfills();

    if (!compiler.options.plugins?.length) {
      compiler.options.plugins = [];
    }

    // additional plugin to handle "node:" URIs
    compiler.options.plugins.push(
      new compiler.webpack.NormalModuleReplacementPlugin(
        /node:/,
        (resource) => {
          const mod = resource.request.replace(/^node:/, '');
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

    if (this.buildProd) {
      compiler.options.externals = [
        // eslint-disable-next-line
        function ({ _, request }, callback) {
          [...polyfillsManager.external].map(([key]) => {
            const pattern = new RegExp(`${key}$`);
            if (pattern.test(request)) {
              return callback(null, `module ${request}`);
            }
            return callback();
          });
        },
      ];
    } else {
      compiler.options.resolve.fallback = {
        ...Object.fromEntries(
          [...polyfillsManager.external].map(([key, value]) => [key, value]),
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
