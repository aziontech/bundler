import { AzionBuildPreset, BuildContext } from 'azion/config';
import * as utilsNode from 'azion/utils/node';
import path from 'path';
import fsPromises from 'fs/promises';
import { debug } from '#utils';

interface EntrypointOptions {
  ctx: BuildContext;
  preset: AzionBuildPreset;
}

const formatEntryPointsMessage = (
  entry: string | string[] | Record<string, string>,
): string => {
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry)) return entry.join(', ');
  return Object.keys(entry).join(', ');
};

const resolveEntryPaths = (
  entry: string | string[] | Record<string, string>,
): string[] => {
  if (typeof entry === 'string') return [path.resolve(entry)];
  if (Array.isArray(entry)) return entry.map((e) => path.resolve(e));
  return Object.values(entry).map((e) => path.resolve(e));
};

/**
 * Resolves the entrypoint based on priority:
 * 1. Command line entrypoint (ctx.entrypoint)
 * 2. Preset handler (if preset.handler is true)
 * 3. Preset default entry config (preset.config.build.entry)
 *
 * @throws Error if no valid entrypoint is found or if provided entrypoint doesn't exist
 */
export const resolveHandler = async ({
  ctx,
  preset,
}: EntrypointOptions): Promise<string | string[]> => {
  // Step 1: Check for user-provided entrypoint
  if (ctx.entrypoint && !preset.handler) {
    const resolveEntrypoint = async (
      entry: string | string[] | Record<string, string>,
    ) => {
      const entries = resolveEntryPaths(entry);

      await Promise.all(
        entries.map(async (entrypointPath, index) => {
          try {
            await fsPromises.access(entrypointPath);
          } catch (error) {
            debug.error(error);
            const originalPath =
              typeof entry === 'string'
                ? entry
                : Array.isArray(entry)
                  ? entry[index]
                  : Object.values(entry as Record<string, string>)[index];
            throw new Error(
              `Entry point "${originalPath}" was not found. Please verify the path and try again.`,
            );
          }
        }),
      );

      utilsNode.feedback.build.info(
        `Using entry point(s): ${formatEntryPointsMessage(entry)}`,
      );
      return entries.length === 1 ? entries[0] : entries;
    };

    return resolveEntrypoint(ctx.entrypoint);
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
    utilsNode.feedback.build.info(
      `Using preset default entry: ${formatEntryPointsMessage(presetEntry)}`,
    );

    const resolvedEntries = resolveEntryPaths(presetEntry);
    console.log('resolvedEntries', resolvedEntries);
    return resolvedEntries.length === 1 ? resolvedEntries[0] : resolvedEntries;
  }

  // No valid entrypoint found
  throw new Error(
    `Cannot determine entry point. Please specify one using --entry or in your configuration.`,
  );
};
