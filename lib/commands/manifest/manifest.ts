import {
  type AzionConfig,
  processConfig,
  convertJsonConfigToObject,
} from 'azion/config';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve, extname } from 'path';
import { feedback } from 'azion/utils/node';
import { readUserConfig, writeUserConfig } from '../../env/bundler';
import { promises as fsPromises } from 'fs';

export const DEFAULT_TRANSFORM_INPUT_PATH = '.edge/manifest.json';
export const DEFAULT_TRANSFORM_OUTPUT_PATH = 'azion.config';

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
  if (!existsSync(outputPath)) mkdirSync(outputPath, { recursive: true });

  // Determine config source
  let config: AzionConfig;

  if (typeof input === 'object') {
    config = input;
  } else {
    config = await readUserConfig(input);
    if (!config) {
      throw new Error(
        input
          ? `Failed to load config from ${input}`
          : 'No configuration found. Please provide a config file or object.',
      );
    }
  }

  // Process and transform config into manifest
  const manifest = processConfig(config);
  // Write manifest to file
  const manifestPath = join(outputPath, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  feedback.success(`Manifest generated successfully at ${manifestPath}`);
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
  outputPath = DEFAULT_TRANSFORM_OUTPUT_PATH,
): Promise<void> => {
  const readConfigFromPath = async (filePath: string): Promise<AzionConfig> => {
    const resolvedPath = resolve(process.cwd(), filePath);

    if (extname(resolvedPath) !== '.json') {
      throw new Error('Input file must be .json');
    }

    const jsonString = await fsPromises.readFile(resolvedPath, 'utf8');
    return convertJsonConfigToObject(jsonString);
  };

  const config = await readConfigFromPath(
    input || DEFAULT_TRANSFORM_INPUT_PATH,
  );
  await writeUserConfig(config);

  feedback.success(`Config file generated successfully at ${outputPath}`);
};

export default generateManifest;
