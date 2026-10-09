import fs from 'fs';
import path from 'path';

/**
 * Resolves the path given by `--config-file` to an absolute one (relative paths are resolved from the cwd).
 *
 * When no path is given, it returns `undefined`, and the config is searched in the default places.
 * An explicit path never falls back to the default search: if it does not point to a file, it throws.
 */
export const resolveConfigFile = (configFile?: string): string | undefined => {
  if (!configFile) return undefined;

  const resolvedPath = path.resolve(process.cwd(), configFile);

  const isFile = fs.statSync(resolvedPath, { throwIfNoEntry: false })?.isFile() ?? false;

  if (!isFile) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  return resolvedPath;
};
