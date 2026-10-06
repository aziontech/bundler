import { type AzionConfig, convertJsonConfigToObject, validateConfig } from '@aziontech/config';
import { parseConfigVersion, resolveConfigVersion } from '../../env/config-version';
import { join, resolve, extname } from 'path';
import * as utilsNode from '@aziontech/utils/node';
import envBundler from '../../env/bundler';
import { promises as fsPromises } from 'fs';
import util from './util';

export const DEFAULT_TRANSFORM_INPUT_PATH = '.edge/manifest.json';
export const DEFAULT_TRANSFORM_OUTPUT_PATH = 'azion.config';

/**
 * Generates or updates the CDN manifest based on a custom configuration.
 * If no input is provided, tries to read from azion.config file.
 *
 * @param input - Build configuration object or path to config file (optional)
 * @param outputPath - Optional output path for the manifest file
 * @param options.configVersion - Config version, when the config does not declare one (defaults to the package default)
 */
export const generateManifest = async (
  input?: AzionConfig | string,
  outputPath = join(process.cwd(), '.edge'),
  options: { configVersion?: string | number } = {},
): Promise<void> => {
  try {
    await fsPromises.access(outputPath);
  } catch {
    await fsPromises.mkdir(outputPath, { recursive: true });
  }

  let config: AzionConfig;

  if (typeof input === 'object') {
    config = input;
  } else {
    const configResult = await envBundler.readAzionConfig(input, options);
    if (!configResult) {
      throw new Error(
        input
          ? `Failed to load config from ${input}`
          : 'No configuration found. Please provide a config file or object.',
      );
    }
    config = configResult;
  }

  // the version decides the schema and the strategies used below
  config = {
    ...config,
    version: resolveConfigVersion({
      flag: options.configVersion,
      config,
    }) as AzionConfig['version'],
  };

  // validate config
  validateConfig(config);

  // Process and transform config into manifest
  const manifest = util.processConfigWrapper(config);
  // Write manifest to file
  const manifestPath = join(outputPath, 'manifest.json');
  await fsPromises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  utilsNode.feedback.manifest.success(`Manifest generated successfully at ${manifestPath}`);
};

/**
 * Transforms a JSON manifest file into an Azion configuration module.
 * If no input is provided, uses the default manifest path.
 *
 * @param input - Path to manifest file
 * @param outputPath - Path for the output JS file
 * @param options.configVersion - Config version of the generated file (defaults to the package default)
 */
export const transformManifest = async (
  input?: string,
  outputPath = DEFAULT_TRANSFORM_OUTPUT_PATH,
  options: { configVersion?: string | number } = {},
): Promise<void> => {
  const readConfigFromPath = async (filePath: string): Promise<AzionConfig> => {
    const resolvedPath = resolve(process.cwd(), filePath);

    if (extname(resolvedPath) !== '.json') {
      throw new Error('Input file must be .json');
    }

    const jsonString = await fsPromises.readFile(resolvedPath, 'utf8');

    return convertJsonConfigToObject(jsonString, {
      version: parseConfigVersion(options.configVersion),
    });
  };

  const config = await readConfigFromPath(input || DEFAULT_TRANSFORM_INPUT_PATH);
  const version = resolveConfigVersion({ flag: options.configVersion }) as AzionConfig['version'];
  await envBundler.writeUserConfig({ ...config, version }, outputPath);

  utilsNode.feedback.manifest.success(`Config file generated successfully at ${outputPath}`);
};

export default generateManifest;
