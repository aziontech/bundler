import path from 'path';
import fsPromises from 'fs/promises';
import { AzionBuildPreset, BuildEntryPoint } from 'azion/config';
import * as utilsNode from 'azion/utils/node';
import { debug } from '#utils';
import { relative } from 'path';
import { normalizeEntryPaths } from './utils';

interface EntrypointOptions {
  entrypoint: BuildEntryPoint | undefined;
  preset: AzionBuildPreset;
}

/**
 * Resolves the entrypoint based on priority:
 * 1. Command line entrypoint (ctx.handler)
 * 2. Preset handler (if preset.handler is true)
 * 3. Preset default entry config (preset.config.build.entry)
 *
 * @throws Error if no valid entrypoint is found or if provided entrypoint doesn't exist
 */
export const resolveHandlers = async ({
  entrypoint,
  preset,
}: EntrypointOptions): Promise<string[]> => {
  // Normalize entrypoint first
  if (entrypoint && !preset.handler) {
    const entries = normalizeEntryPaths(entrypoint);
    const resolvedEntries = entries.map((e) => path.resolve(e));

    await Promise.all(
      resolvedEntries.map(async (entry) => {
        try {
          await fsPromises.access(entry);
        } catch (error) {
          debug.error(error);
          throw new Error(
            `Entry point "${entry}" was not found. Please verify the path and try again.`,
          );
        }
      }),
    );

    utilsNode.feedback.build.info(
      `Using entry point(s): ${entries.map((e) => relative(process.cwd(), e)).join(', ')}`,
    );
    return resolvedEntries;
  }

  // Preset handler takes second priority
  if (preset.handler) {
    const presetPath = globalThis.bundler.root.includes('node_modules')
      ? path.resolve(globalThis.bundler.root, '../')
      : path.resolve(globalThis.bundler.root, 'node_modules');

    const handlerPath = path.resolve(
      presetPath,
      'azion/packages/presets/dist/presets',
      preset.metadata.name,
      'handler.js',
    );

    utilsNode.feedback.build.info(`Using built-in handler from "${preset.metadata.name}" preset.`);
    return [handlerPath];
  }

  // Preset's default entry is last priority
  if (preset.config.build?.entry) {
    const entries = normalizeEntryPaths(preset.config.build.entry).map((e) => path.resolve(e));

    utilsNode.feedback.build.info(`Using preset default entry: ${entries.join(', ')}`);
    return entries;
  }

  throw new Error(
    'Cannot determine entry point. Please specify one using --entry or in your configuration.',
  );
};
