import { join, basename, dirname, extname } from 'path';
import { BuildEntryPoint } from 'azion/config';

type GetTempEntryPathsOptions = {
  entry: BuildEntryPoint | undefined;
  ext: string;
  basePath?: string;
};

export const getTempEntryPaths = ({
  entry,
  ext,
  basePath = join('.edge', 'functions'),
}: GetTempEntryPathsOptions): Record<string, string> => {
  if (!entry) throw new Error('Entrypoint is required');

  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const createEntryRecord = (
    entryPath: string,
    outputPath?: string,
  ): Record<string, string> => {
    const base = basename(entryPath, extname(entryPath));
    const dir = dirname(entryPath);

    const tempPath = join(dir, `azion-${base}-${timestamp}.temp.${ext}`);

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

  if (typeof entry === 'string') return createEntryRecord(entry);

  if (Array.isArray(entry)) {
    return entry.reduce((acc, e) => ({ ...acc, ...createEntryRecord(e) }), {});
  }
  return Object.entries(entry).reduce(
    (acc, [key, value]) => ({ ...acc, ...createEntryRecord(value, key) }),
    {},
  );
};
