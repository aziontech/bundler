import { AzionBuildPreset, BuildContext } from 'azion/config';
import { feedback } from 'azion/utils/node';
import { resolve } from 'path';

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
 * @throws Error if no valid entrypoint is found
 */
export const resolveEntrypoint = async ({
  ctx,
  preset,
}: EntrypointOptions): Promise<string> => {
  // Step 1: Check for user-provided entrypoint
  if (ctx.entrypoint) {
    feedback.build.info(`Using ${ctx.entrypoint} as entry point.`);
    return ctx.entrypoint;
  }

  // Step 2: Check for preset handler
  if (preset.handler) {
    feedback.build.info(
      `Using built-in handler from "${preset.metadata.name}" preset.`,
    );

    // Resolve handler path from bundler's node_modules
    return resolve(
      globalThis.bundler.root,
      'node_modules',
      'azion',
      'presets',
      preset.metadata.name,
      'handler.ts',
    );
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
