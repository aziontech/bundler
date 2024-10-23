import webpack from 'webpack';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';

const isDev = !globalThis.vulcan?.buildProd;

const require = createRequire(import.meta.url);

const projectRoot = process.cwd();
const isWindows = process.platform === 'win32';
const outputPath = isWindows
  ? fileURLToPath(new URL(`file:///${join(projectRoot, '.edge')}`))
  : join(projectRoot, '.edge');

const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
};

/**
 * Define the loader typescript rules if the tsconfig.json file exists
 * @returns {import('webpack').Configuration} - Module rules
 */
const defineLoaderTypescriptRules = () => {
  const tsConfigPath = join(projectRoot, 'tsconfig.json');
  const tsConfigExist = fileExists(tsConfigPath);
  if (tsConfigExist) {
    return {
      module: {
        rules: [
          {
            test: /\.ts?$/,
            use: [
              {
                loader: require.resolve('ts-loader'),
                options: {
                  transpileOnly: true,
                },
              },
            ],
            exclude: /node_modules/,
          },
        ],
      },
    };
  }
  return { module: {} };
};

const azionCliBanner = `
/**
 * Built with Azion CLI
 * For more information, visit: https://www.azion.com/en/documentation/products/cli/
 */
`;

const devBannerComment = `
/**
 * WARNING: DEVELOPMENT BUILD
 * 
 * This file is a development build and contains additional injected code
 * to facilitate the development and debugging process.
 * 
 * IMPORTANT NOTICES:
 * - DO NOT use this build in a production environment.
 * - The injected code may cause unexpected behaviors in production.
 * - Performance of this build is not optimized for production use.
 * - This build may include sensitive debugging information.
 * 
 * To generate an optimized and secure production build use 'azion build'.
 * 
 * If you are seeing this message in a production environment, stop immediately
 * and replace this file with a proper production build.
 * 
 * For any issues or questions, please refer to the documentation or contact
 * the development team.
 */
`;

export default {
  experiments: {
    outputModule: true,
  },
  output: {
    path: outputPath,
    filename: isDev ? 'worker.dev.js' : 'worker.js',
    globalObject: 'globalThis',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    mainFields: ['browser', 'main', 'module'],
  },
  // loaders
  ...defineLoaderTypescriptRules(),
  mode: 'production',
  target: ['webworker', 'es2022'],
  plugins: [
    new webpack.ProgressPlugin(),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new webpack.BannerPlugin({
      banner: azionCliBanner,
      raw: true,
      entryOnly: true,
    }),
    ...(isDev
      ? [
          new webpack.BannerPlugin({
            banner: devBannerComment,
            raw: true,
            entryOnly: true,
          }),
        ]
      : []),
  ],
  optimization: {
    minimize: !isDev,
  },
};
