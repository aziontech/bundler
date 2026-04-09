import fsPromises from 'fs/promises';
import { join } from 'path';

interface WorkerGlobalsConfig {
  namespace: string;
  property?: string;
  vars: Record<string, string>;
}

interface WorkerMemoryFilesConfig {
  namespace: string;
  property: string;
  dirs: string[];
}

interface StorageConfig {
  dirs: string[];
  prefix: string;
  outputPath: string;
}

export const injectWorkerMemoryFiles = async ({
  namespace,
  property,
  dirs,
}: WorkerMemoryFilesConfig) => {
  const result: Record<string, { content: string }> = {};

  const processDirectory = async (currentDirs: string[]) => {
    for (const dir of currentDirs) {
      const files = await fsPromises.readdir(dir);

      for (const file of files) {
        const filePath = join(dir, file);
        const stats = await fsPromises.stat(filePath);

        if (stats.isDirectory()) {
          await processDirectory([filePath]); // Chamada recursiva
        } else if (stats.isFile()) {
          const bufferContent = await fsPromises.readFile(filePath);
          let key = filePath;
          if (!filePath.startsWith('/')) key = `/${filePath}`;
          result[key] = { content: bufferContent.toString('base64') };
        }
      }
    }
  };

  await processDirectory(dirs);

  return `globalThis.${namespace}.${property}=${JSON.stringify(result)};`;
};

export const copyFilesToLocalEdgeStorage = async ({ dirs, prefix, outputPath }: StorageConfig) => {
  await Promise.all(
    dirs.map(async (dir) => {
      const targetPath = prefix ? dir.replace(prefix, '') : dir;
      const fullTargetPath = join(outputPath, targetPath);

      const exists = await fsPromises
        .access(fullTargetPath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        await fsPromises.mkdir(fullTargetPath, { recursive: true });
      }

      await fsPromises.cp(dir, fullTargetPath, { recursive: true });
    }),
  );
};

export const injectWorkerGlobals = ({ namespace, property, vars }: WorkerGlobalsConfig) =>
  Object.entries(vars).reduce(
    (acc, [key, value]) => {
      const propPath = property ? `${namespace}.${property}` : namespace;
      return `${acc} globalThis.${propPath}.${key}=${value};`;
    },
    property ? `globalThis.${namespace}.${property}={};` : `globalThis.${namespace}={};`,
  );

export const injectWorkerPathPrefix = async ({
  namespace,
  property,
  prefix,
}: {
  namespace: string;
  property: string;
  prefix: string;
}) => {
  const formattedPrefix = prefix && typeof prefix === 'string' && prefix !== '' ? prefix : '""';
  return `globalThis.${namespace} = { ...globalThis.${namespace}, ${property}: '${formattedPrefix}'};`;
};

export default {
  injectWorkerMemoryFiles,
  copyFilesToLocalEdgeStorage,
  injectWorkerGlobals,
  injectWorkerPathPrefix,
};
