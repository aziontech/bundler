import { type AzionConfig, convertJsonConfigToObject } from 'azion/config';
import { promises as fs } from 'fs';
import { join, resolve, extname } from 'path';
import * as utilsNode from 'azion/utils/node';
import envBundler from '../../env/bundler';
import util from './util';
import { DIRECTORIES, BUNDLER } from '#constants';

/**
 * Generates or updates the CDN manifest based on a custom configuration.
 * If no input is provided, tries to read from azion.config file.
 *
 * @param input - Build configuration object or path to config file (optional)
 * @param outputPath - Optional output path for the manifest file
 */
export const generateManifest = async (
  input?: AzionConfig | string,
  outputPath = join(process.cwd(), '.edge'),
): Promise<void> => {
  // Ensure output directory exists
  try {
    await fs.access(outputPath);
  } catch {
    await fs.mkdir(outputPath, { recursive: true });
  }

  // Determine config source
  let config: AzionConfig;

  if (typeof input === 'object') {
    config = input;
  } else {
    config = await envBundler.readUserConfig(input);
    if (!config) {
      throw new Error(
        input
          ? `Failed to load config from ${input}`
          : 'No configuration found. Please provide a config file or object.',
      );
    }
  }

  // Process and transform config into manifest
  const manifest = util.processConfigWrapper(config);
  // Write manifest to file
  const manifestPath = join(outputPath, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  utilsNode.feedback.success(
    `Manifest generated successfully at ${manifestPath}`,
  );
};

/**
 * Transforms a JSON manifest file into an Azion configuration module.
 * If no input is provided, uses the default manifest path.
 *
 * @param input - Path to manifest file
 * @param outputPath - Path for the output JS file
 */
export const transformManifest = async (
  input?: string,
  outputPath = BUNDLER.CONFIG_FILENAME,
): Promise<void> => {
  const readConfigFromPath = async (filePath: string): Promise<AzionConfig> => {
    const resolvedPath = resolve(process.cwd(), filePath);

    if (extname(resolvedPath) !== '.json') {
      throw new Error('Input file must be .json');
    }

    const jsonString = await fs.readFile(resolvedPath, 'utf8');
    return convertJsonConfigToObject(jsonString);
  };

  const config = await readConfigFromPath(
    input || DIRECTORIES.OUTPUT_MANIFEST_PATH,
  );
  await envBundler.writeUserConfig(config);

  utilsNode.feedback.success(
    `Config file generated successfully at ${outputPath}`,
  );
};

export default generateManifest;
