import { join, basename, dirname, extname, resolve } from 'path';
import { BuildEntryPoint } from 'azion/config';
import { access } from 'fs/promises';

// Well-defined types
type GetTempEntryPathsOptions = {
  entry: BuildEntryPoint | string;
  ext?: string;
  basePath?: string;
  production?: boolean;
  bundler?: string;
};

/**
 * Generates a timestamp in YYYYMMDD format
 */
export const generateTimestamp = (): string => {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
};

/**
 * Validates that all entry points exist in the file system
 */
export const validateEntryPoints = async (entry: BuildEntryPoint): Promise<void> => {
  const entries = Array.isArray(entry)
    ? entry
    : typeof entry === 'string'
      ? [entry]
      : Object.values(entry);

  await Promise.all(
    entries.map(async (entryPath) => {
      try {
        await access(entryPath);
      } catch (error) {
        throw new Error(
          `Entry point "${entryPath}" was not found. Please verify the path and try again.`,
        );
      }
    }),
  );
};

/**
 * Creates a map of entry paths to output paths
 */
export const createPathEntriesMap = async ({
  entry,
  ext = 'js',
  basePath = '.edge/functions',
  production = true,
  bundler,
}: GetTempEntryPathsOptions): Promise<Record<string, string>> => {
  const timestamp = generateTimestamp();

  /**
   * Creates an entry record with temporary and final paths
   */
  const createEntryRecord = (entryPath: string, outputPath?: string): Record<string, string> => {
    const base = basename(entryPath, extname(entryPath));
    const dir = dirname(entryPath);

    // Temporary file
    const tempFileName = `azion-${base}-${timestamp}.temp.${ext}`;
    const tempPath = resolve(process.cwd(), tempFileName);

    // When using webpack as bundler, we need to explicitly add .js extension
    const finalExt = bundler === 'webpack' ? '.js' : '';
    const devSuffix = production ? '' : '.dev';

    // Determine the final path
    let finalPath: string;
    if (outputPath) {
      const outputWithoutExt = outputPath.replace(/\.[^/.]+$/, '');
      finalPath = join(basePath, `${outputWithoutExt}${devSuffix}${finalExt}`);
    } else {
      finalPath = join(basePath, dir, `${base}${devSuffix}${finalExt}`);
    }

    return { [finalPath]: tempPath };
  };

  // Process entry based on type
  if (typeof entry === 'string') {
    const base = basename(entry, extname(entry));
    const outputKey = `${base}${production ? '' : '.dev'}`;
    return { ...createEntryRecord(entry, outputKey) };
  }

  if (Array.isArray(entry)) {
    return entry.reduce((acc, e) => ({ ...acc, ...createEntryRecord(e) }), {});
  }

  // Entry is an object
  return Object.entries(entry).reduce(
    (acc, [key, value]) => ({ ...acc, ...createEntryRecord(value, key) }),
    {},
  );
};
