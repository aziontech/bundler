import fsPromises from 'fs/promises';
import { join } from 'path';
import { resolveEnvAliasPrefix } from '../../../../env/alias';
import { resolveMergedEnvEntries } from '../../../../env/dotenv';

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
    await Promise.all(
      currentDirs.map(async (dir) => {
        const files = await fsPromises.readdir(dir);

        await Promise.all(
          files.map(async (file) => {
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
          }),
        );
      }),
    );
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

/**
 * Temporary workaround for Azion's global environment variables (see ENV_ALIAS in constants.ts).
 * Reads the key names declared in the project's .env file and, if a prefix is available, returns
 * esbuild `define` entries that rewrite `process.env.${KEY}` to `process.env.${prefix}${KEY}`
 * directly in the compiled code — a build-time text substitution, not a runtime assignment.
 *
 * On Azion's production runtime, `process`/`process.env` are fully read-only (both mutating
 * individual keys and swapping the whole `env`/`process` reference throw "Cannot set on
 * process.env"), so there is no way to remap env names from injected runtime code. Rewriting the
 * property name at build time sidesteps that entirely, since it only changes what the compiled
 * code reads — it never writes to `process.env`.
 *
 * The prefix comes from AZ_BUNDLER_ENV_ALIAS_PREFIX when set (explicit override), otherwise it's
 * derived from the first application's name in azion.config.
 *
 * Limitation: esbuild's `define` only rewrites statically-analyzable references
 * (`process.env.KEY` or `process.env['KEY']` with a literal key). Code that reads env vars via a
 * computed key (`process.env[someVariable]`) won't be caught by this.
 */
export const buildEnvAliasDefineVars = async (
  cwd: string,
  applicationName?: string,
): Promise<Record<string, string>> => {
  const prefix = resolveEnvAliasPrefix(applicationName);
  if (!prefix) return {};

  const entries = await resolveMergedEnvEntries(cwd, true);
  if (entries.length === 0) return {};

  return Object.fromEntries(
    entries.map(({ key }) => [`process.env.${key}`, `process.env.${prefix}${key}`]),
  );
};

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
  buildEnvAliasDefineVars,
};
