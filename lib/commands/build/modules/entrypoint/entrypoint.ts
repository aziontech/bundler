import { AzionBuildPreset, BuildContext } from 'azion/config';
import { feedback } from 'azion/utils/node';
import { resolve } from 'path';
import { access } from 'fs/promises';
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
    const entrypointPath = resolve(ctx.entrypoint);
    try {
      await access(entrypointPath);
      feedback.build.info(`Using ${ctx.entrypoint} as entry point.`);
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
    const handlerPath = resolve(
      globalThis.bundler.root,
      'node_modules',
      'azion',
      'packages',
      'presets',
      'src',
      'presets',
      preset.metadata.name,
      'handler.ts',
    );

    feedback.build.info(
      `Using built-in handler from "${preset.metadata.name}" preset.`,
    );

    return handlerPath;
  }

  // Step 3: Check for preset's default entry
  if (preset.config.build?.entry) {
    const presetEntry = preset.config.build.entry;
    feedback.build.info(`Using preset default entry: ${presetEntry}`);
    return resolve(presetEntry);
  }

  // No valid entrypoint found
  throw new Error(
    `Cannot determine entry point. Please specify one using --entry or in your configuration.`,
  );
};
