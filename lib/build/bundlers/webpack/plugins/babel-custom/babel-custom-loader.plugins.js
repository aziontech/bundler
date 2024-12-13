/* eslint-disable no-param-reassign,class-methods-use-this */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

class BabelCustomLoaderPlugin {
  constructor(preset, presetsAllowed) {
    this.preset = preset || '';
    this.presetsAllowed = presetsAllowed || [];
  }

  apply(compiler) {
    const rules = compiler.options.module.rules || [];

    if (this.presetsAllowed.includes(this.preset)) {
      rules.push({
        test: /\.func.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            compact: false,
            plugins: [
              [
                require.resolve(
                  '@babel/plugin-proposal-optional-chaining-assign',
                ),
                { version: '2023-07' },
              ],
            ],
          },
        },
      });

      compiler.options.module.rules = rules;
    }
  }
}

export default BabelCustomLoaderPlugin;
