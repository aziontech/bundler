import { cpSync, existsSync, mkdirSync } from 'fs';
import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import { AzionBuild } from 'azion/config';

interface WorkerGlobalsConfig {
  namespace: string;
  property: string;
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

  for (const dir of dirs) {
    const files = await readdir(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stats = await stat(filePath);

      if (stats.isDirectory()) {
        const subDirContent = await injectWorkerMemoryFiles({
          namespace,
          property,
          dirs: [filePath],
        });
        Object.assign(result, subDirContent);
      } else if (stats.isFile()) {
        const bufferContent = await readFile(filePath);
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

    if (!existsSync(fullTargetPath)) {
      mkdirSync(fullTargetPath, { recursive: true });
    }

    cpSync(dir, fullTargetPath, { recursive: true });
  });
};

export const injectWorkerGlobals = ({
  namespace,
  property,
  vars,
}: WorkerGlobalsConfig) =>
  Object.entries(vars).reduce(
    (acc, [key, value]) =>
      `${acc} globalThis.${namespace}.${property}.${key}=${value};`,
    `globalThis.${namespace}.${property}={};`,
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
  return `globalThis.${namespace} = {}; globalThis.${namespace}.${property} = '${formattedPrefix}';`;
};
