import { readAzionConfig } from '../../env';
import { resolveConfigFile } from '../../env/config-file';
import { resolveConfigVersion } from '../../env/config-version';
import { build } from './build';
import { type AzionConfig } from '@aziontech/config';
import type { BuildCommandOptions } from './types';
import { cleanDirectory, resolveConfigPriority } from './utils';
import { feedback } from '@aziontech/utils/node';
import {
  BUILD_CONFIG_DEFAULTS,
  DIRECTORIES,
  DOCS_MESSAGE,
  type BundlerType,
} from '../../constants';

/**
 * @function buildCommand
 * @description A command to initiate the build process.
 * @example
 *
 * buildCommand({
 *   entry: './src/index.ts',
 *   preset: 'typescript',
 *   polyfills: false,
 *   worker: true,
 *   bundler: 'webpack',
 * });
 */
export async function buildCommand(options: BuildCommandOptions) {
  let configFile: string | undefined;
  try {
    configFile = resolveConfigFile(options.configFile);
  } catch (error) {
    feedback.build.error(
      `${error instanceof Error ? error.message : String(error)}${DOCS_MESSAGE}`,
    );
    process.exit(1);
  }

  const userConfig =
    (await readAzionConfig(configFile, { configVersion: options.configVersion })) || {};

  // --config-version > azion.config `version` > default
  let version: ReturnType<typeof resolveConfigVersion>;
  try {
    version = resolveConfigVersion({ flag: options.configVersion, config: userConfig });
  } catch (error) {
    feedback.build.error(
      `${error instanceof Error ? error.message : String(error)}${DOCS_MESSAGE}`,
    );
    process.exit(1);
  }

  const { build: userBuildConfig } = userConfig;

  const resolvedBuildConfig = {
    preset: resolveConfigPriority({
      inputValue: options.preset,
      fileValue: userBuildConfig?.preset,
      defaultValue: BUILD_CONFIG_DEFAULTS.PRESET,
    }),
    entry: resolveConfigPriority({
      inputValue: options.entry,
      fileValue: userBuildConfig?.entry,
      defaultValue: BUILD_CONFIG_DEFAULTS.ENTRY,
    }),
    bundler: resolveConfigPriority<BundlerType>({
      inputValue: undefined,
      fileValue: userBuildConfig?.bundler,
      defaultValue: BUILD_CONFIG_DEFAULTS.BUNDLER,
    }),
    polyfills: resolveConfigPriority({
      inputValue: userBuildConfig?.polyfills,
      fileValue: options.polyfills,
      defaultValue: BUILD_CONFIG_DEFAULTS.POLYFILLS,
    }),
  };

  const config: AzionConfig = {
    ...userConfig,
    // the pipeline is typed with the default (v4) config; v3 specific fields are read through @aziontech/config accessors
    version: version as AzionConfig['version'],
    build: {
      ...resolvedBuildConfig,
      memoryFS: userConfig?.build?.memoryFS,
      extend: userConfig?.build?.extend,
    },
  };

  if (options.production) await cleanDirectory([DIRECTORIES.OUTPUT_BASE_PATH]);
  return build({
    config,
    options: {
      production: options.production,
      skipFrameworkBuild: options.skipFrameworkBuild,
      onlyGenerateConfig: options.onlyGenerateConfig,
      telemetry: options.telemetry,
      configFile,
    },
  });
}
