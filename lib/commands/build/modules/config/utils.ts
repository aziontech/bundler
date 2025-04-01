import { join, basename, dirname, extname } from 'path';
import { BuildEntryPoint } from 'azion/config';
import { DIRECTORIES, FILE_PATTERNS, BUILD_DEFAULTS } from '#constants';
import { access } from 'fs/promises';
type GetTempEntryPathsOptions = {
  entry: BuildEntryPoint | string;
  ext?: string;
  basePath?: string;
};

export const generateTimestamp = (): string => {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
};

export const validateEntryPoints = async (entry: BuildEntryPoint): Promise<void> => {
  const entries = Array.isArray(entry)
    ? entry
    : typeof entry === 'string'
      ? [entry]
      : Object.values(entry);

  await Promise.all(
    entries.map(async (entry) => {
      try {
        await access(entry);
      } catch (error) {
        throw new Error(
          `Entry point "${entry}" was not found. Please verify the path and try again.`,
        );
      }
    }),
  );
};

export const createPathEntriesMap = async ({
  entry,
  ext = BUILD_DEFAULTS.EXTENSION,
  basePath = DIRECTORIES.OUTPUT_FUNCTIONS_PATH,
}: GetTempEntryPathsOptions): Promise<Record<string, string>> => {
  const timestamp = generateTimestamp();

  const createEntryRecord = (entryPath: string, outputPath?: string): Record<string, string> => {
    const base = basename(entryPath, extname(entryPath));
    const dir = dirname(entryPath);

    const tempPath = join(dir, FILE_PATTERNS.TEMP_FILE(base, timestamp, ext));

    if (outputPath) {
      const outputWithoutExt = outputPath.replace(/\.[^/.]+$/, '');
      return {
        [join(basePath, outputWithoutExt)]: tempPath,
      };
    }

    return {
      [join(basePath, dir, base)]: tempPath,
    };
  };

  if (typeof entry === 'string') {
    await validateEntryPoints(entry);
    return createEntryRecord(entry);
  }

  if (Array.isArray(entry)) {
    await validateEntryPoints(entry);
    return entry.reduce((acc, e) => ({ ...acc, ...createEntryRecord(e) }), {});
  }

  await validateEntryPoints(Object.values(entry));
  return Object.entries(entry).reduce(
    (acc, [key, value]) => ({ ...acc, ...createEntryRecord(value, key) }),
    {},
  );
};
