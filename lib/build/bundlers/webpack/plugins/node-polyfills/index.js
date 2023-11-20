/* eslint-disable no-param-reassign,class-methods-use-this */
import builtinsPolyfills from '../../../polyfills/node-polyfills-paths.js';

class NodePolyfillPlugin {
  apply(compiler) {
    const polyfilledBuiltins = builtinsPolyfills();

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
        process: polyfilledBuiltins.globals.get('process'),
      }),
    );

    compiler.options.resolve.fallback = {
      ...Object.fromEntries(
        [...polyfilledBuiltins.libs].map(([key, value]) => [key, value]),
      ),
      ...compiler.options.resolve.fallback,
    };
  }
}

export default NodePolyfillPlugin;
