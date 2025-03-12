import {
  type AzionConfig,
  processConfig,
  convertJsonConfigToObject,
} from 'azion/config';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve, extname } from 'path';
import { feedback } from 'azion/utils/node';
import { readUserConfig } from '../../env/bundler';
import { promises as fsPromises } from 'fs';

// Constants for default paths (matching those in command.ts)
const DEFAULT_TRANSFORM_INPUT_PATH = '.edge/manifest.json';
const DEFAULT_TRANSFORM_OUTPUT_PATH = 'azion.config.js';

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
    // Direct object input
    config = input;
  } else {
    // Use readUserConfig to find configuration file (handles both undefined and string path)
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
 * Transforms a JSON manifest file or config object into an Azion configuration module.
 * If no input is provided, uses the default manifest path.
 *
 * @param input - Path to manifest file or configuration object (optional)
 * @param outputPath - Path for the output JS file
 */
export const transformManifest = async (
  input?: string | AzionConfig,
  outputPath = DEFAULT_TRANSFORM_OUTPUT_PATH,
): Promise<void> => {
  let config: AzionConfig;

  if (!input) {
    // Use default input path
    const defaultPath = resolve(process.cwd(), DEFAULT_TRANSFORM_INPUT_PATH);
    if (!existsSync(defaultPath)) {
      throw new Error(
        `Default manifest file not found at ${DEFAULT_TRANSFORM_INPUT_PATH}. Please specify an input file path.`,
      );
    }

    const jsonString = await fsPromises.readFile(defaultPath, 'utf8');
    config = convertJsonConfigToObject(jsonString);
  } else if (typeof input === 'string') {
    // Resolve input path
    const inputPath = resolve(process.cwd(), input);

    // Validate file extension
    if (extname(inputPath) !== '.json') {
      throw new Error('Input file must be .json');
    }

    // Read and parse JSON file
    const jsonString = await fsPromises.readFile(inputPath, 'utf8');
    config = convertJsonConfigToObject(jsonString);
  } else {
    // Use input directly as config object
    config = input;
  }

  // Generate JavaScript module content
  const content = `export default ${JSON.stringify(config, null, 2)};`;

  // Write to output file
  await fsPromises.writeFile(outputPath, content);

  feedback.success(`Config file generated successfully at ${outputPath}`);
};

export default generateManifest;
