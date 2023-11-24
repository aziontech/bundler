/* eslint-disable no-param-reassign,class-methods-use-this */
import { generateWebpackBanner } from '#utils';
import PolyfillsManager from '../../../polyfills/polyfills-manager.js';

class NodePolyfillPlugin {
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
      }),
    );

    compiler.options.plugins.push(
      new compiler.webpack.BannerPlugin({
        banner: generateWebpackBanner([
          polyfillsManager.globals.get('navigator'),
          polyfillsManager.globals.get('performance'),
          polyfillsManager.globals.get('process'),
        ]),
        raw: true,
      }),
    );

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
