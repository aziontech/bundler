import { AzionBuildPreset, BuildContext } from 'azion/config';
import * as utilsNode from 'azion/utils/node';
import path from 'path';
import fsPromises from 'fs/promises';
import { debug } from '#utils';

interface EntrypointOptions {
  ctx: BuildContext;
  preset: AzionBuildPreset;
}

/**
 * Resolves the entrypoint based on priority:
 * 1. Command line entrypoint (ctx.entrypoint)
 * 2. Preset handler (if preset.handler is true)
 * 3. Preset default entry config (preset.config.build.entry)
 *
 * @throws Error if no valid entrypoint is found or if provided entrypoint doesn't exist
 */
export const resolveEntrypoint = async ({
  ctx,
  preset,
}: EntrypointOptions): Promise<string> => {
  // Step 1: Check for user-provided entrypoint
  if (ctx.entrypoint && !preset.handler) {
    const entrypointPath = path.resolve(ctx.entrypoint);
    try {
      await fsPromises.access(entrypointPath);
      utilsNode.feedback.build.info(`Using ${ctx.entrypoint} as entry point.`);
      return ctx.entrypoint;
    } catch (error) {
      debug.error(error);
      throw new Error(
        `Entry point "${ctx.entrypoint}" was not found. Please verify the path and try again.`,
      );
    }
  }

  // Step 2: Check for preset handler
  if (preset.handler) {
    const rootPathNodeModules =
      globalThis.bundler.root.includes('node_modules');
    const presetPath = rootPathNodeModules
      ? path.resolve(globalThis.bundler.root, '../')
      : path.resolve(globalThis.bundler.root, 'node_modules');
    const handlerPath = path.resolve(
      presetPath,
      'azion',
      'packages',
      'presets',
      'dist',
      'presets',
      preset.metadata.name,
      'handler.js',
    );
    utilsNode.feedback.build.info(
      `Using built-in handler from "${preset.metadata.name}" preset.`,
    );

    return handlerPath;
  }

  // Step 3: Check for preset's default entry
  if (preset.config.build?.entry) {
    const presetEntry = preset.config.build.entry;
    utilsNode.feedback.build.info(`Using preset default entry: ${presetEntry}`);
    return path.resolve(presetEntry);
  }

  // No valid entrypoint found
  throw new Error(
    `Cannot determine entry point. Please specify one using --entry or in your configuration.`,
  );
};
