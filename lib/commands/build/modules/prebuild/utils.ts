import fs from 'fs';
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
  if (dirs.length === 0) {
    return '';
  }
  for (const dir of dirs) {
    const files = await fsPromises.readdir(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stats = await fsPromises.stat(filePath);

      if (stats.isDirectory()) {
        const subDirContent = await injectWorkerMemoryFiles({
          namespace,
          property,
          dirs: [filePath],
        });
        Object.assign(result, subDirContent);
      } else if (stats.isFile()) {
        const bufferContent = await fsPromises.readFile(filePath);
        let key = filePath;
        if (!filePath.startsWith('/')) key = `/${filePath}`;
        result[key] = { content: bufferContent.toString('base64') };
      }
    }
  }
  return `globalThis.${namespace}.${property}=${JSON.stringify(result)};`;
};

export const copyFilesToLocalEdgeStorage = ({
  dirs,
  prefix,
  outputPath,
}: StorageConfig) => {
  dirs.forEach((dir) => {
    const targetPath = prefix ? dir.replace(prefix, '') : dir;
    const fullTargetPath = join(outputPath, targetPath);

    if (!fs.existsSync(fullTargetPath)) {
      fs.mkdirSync(fullTargetPath, { recursive: true });
    }

    fs.cpSync(dir, fullTargetPath, { recursive: true });
  });
};

export const injectWorkerGlobals = ({
  namespace,
  property,
  vars,
}: WorkerGlobalsConfig) =>
  Object.entries(vars).reduce(
    (acc, [key, value]) => {
      const propPath = property ? `${namespace}.${property}` : namespace;
      return `${acc} globalThis.${propPath}.${key}=${value};`;
    },
    property
      ? `globalThis.${namespace}.${property}={};`
      : `globalThis.${namespace}={};`,
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
  const formattedPrefix =
    prefix && typeof prefix === 'string' && prefix !== '' ? prefix : '""';
  return `globalThis.${namespace} = { ...globalThis.${namespace}, ${property}: '${formattedPrefix}'};`;
};

export default {
  injectWorkerMemoryFiles,
  copyFilesToLocalEdgeStorage,
  injectWorkerGlobals,
  injectWorkerPathPrefix,
};
