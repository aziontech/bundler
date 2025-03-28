import path from 'path';
import { BuildEntryPoint } from 'azion/config';

export const getTempEntryPaths = (
  entry: BuildEntryPoint | undefined,
  fileExtension: string,
): Record<string, string> => {
  if (!entry) throw new Error('Entrypoint is required');

  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const createEntryRecord = (
    entryPath: string,
    outputPath?: string,
  ): Record<string, string> => {
    const base = path.basename(entryPath, path.extname(entryPath));
    const dir = path.dirname(entryPath);

    const tempPath = path.join(
      dir,
      `azion-${base}-${timestamp}.temp.${fileExtension}`,
    );

    if (outputPath) {
      const outputWithoutExt = outputPath.replace(/\.[^/.]+$/, '');
      return {
        [path.join('.edge', 'functions', outputWithoutExt)]: tempPath,
      };
    }

    return {
      [path.join('.edge', 'functions', dir, base)]: tempPath,
    };
  };

  if (typeof entry === 'string') {
    return createEntryRecord(entry);
  }

  if (Array.isArray(entry)) {
    return entry.reduce((acc, e) => ({ ...acc, ...createEntryRecord(e) }), {});
  }

  // Para objetos, usamos a key completa como caminho
  return Object.entries(entry).reduce(
    (acc, [key, value]) => ({ ...acc, ...createEntryRecord(value, key) }),
    {},
  );
};
