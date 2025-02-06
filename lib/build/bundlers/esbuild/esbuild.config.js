import { join } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = process.cwd();
const isWindows = process.platform === 'win32';
const outputPath = isWindows
  ? fileURLToPath(new URL(`file:///${join(projectRoot, '.edge')}`))
  : join(projectRoot, '.edge');

const isDev = !globalThis.vulcan?.buildProd;

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
  bundle: true,
  minify: !isDev,
  target: 'es2022',
  format: 'esm',
  platform: 'browser',
  mainFields: ['browser', 'module', 'main'],
  loader: {
    '.js': 'jsx',
  },
  outfile: join(outputPath, isDev ? 'worker.dev.js' : 'worker.js'),
  banner: {
    js: isDev ? azionCliBanner + devBannerComment : azionCliBanner,
  },
};
