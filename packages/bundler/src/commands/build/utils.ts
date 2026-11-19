import { createRequire } from 'module';
import { dirname, join, relative } from 'path';
import { readFileSync } from 'fs';
import { readFile, stat, rm, mkdir } from 'fs/promises';
import { getPackageManager } from '@aziontech/utils/node';
import { DIRECTORIES } from '../../constants';
import { createPathEntriesMap } from './modules/config/utils';
import type { ConfigValueOptions, PresetValueOptions, PackageJson } from './types';
import type { AzionFunction, PresetInput, BuildEntryPoint } from '@aziontech/config';

export class PackageJsonError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'PackageJsonError';
  }
}

export class DependenciesError extends Error {
  constructor(packageManager: string) {
    super(`Please install dependencies using ${packageManager}`);
    this.name = 'DependenciesError';
  }
}

/**
 * Resolves the installed version of a dependency. The package.json is not exposed
 * through the package `exports`, so we resolve the entry point and walk up to it.
 */
export const getInstalledPackageVersion = (packageName: string): string | undefined => {
  try {
    let dir = dirname(createRequire(import.meta.url).resolve(packageName));
    while (dir !== dirname(dir)) {
      try {
        const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
        if (pkg.name === packageName) return pkg.version;
      } catch {
        // no package.json in this directory, keep walking up
      }
      dir = dirname(dir);
    }
  } catch {
    // package not resolvable
  }
  return undefined;
};

export const formatBuildBanner = ({
  bundlerVersion,
  builderVersion,
  presetsVersion,
}: {
  bundlerVersion: string;
  builderVersion?: string;
  presetsVersion?: string;
}): string => {
  const title = 'Azion Bundler — build';
  const bar = '─'.repeat(title.length + 2);
  return [
    '',
    `┌${bar}┐`,
    `│ ${title} │`,
    `└${bar}┘`,
    '',
    `App directory: ${process.cwd()}`,
    `Bundler version: ${bundlerVersion}`,
    `@aziontech/builder version: ${builderVersion ?? 'unknown'}`,
    `@aziontech/presets version: ${presetsVersion ?? 'unknown'}`,
    '',
  ].join('\n');
};

export const readPackageJson = async (): Promise<PackageJson> => {
  const packageJsonPath = join(process.cwd(), 'package.json');
  try {
    const content = await readFile(packageJsonPath, 'utf8');
    return JSON.parse(content);
  } catch (error: unknown) {
    throw new PackageJsonError('Failed to read package.json', (error as { code?: string }).code);
  }
};

export const hasNodeModulesDirectory = async (): Promise<boolean> => {
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  try {
    const stats = await stat(nodeModulesPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
};

export const checkDependencies = async (): Promise<void> => {
  let projectJson: PackageJson;

  try {
    projectJson = await readPackageJson();
  } catch (error) {
    if (error instanceof PackageJsonError && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  if (projectJson && (projectJson.dependencies || projectJson.devDependencies)) {
    const pkgManager = await getPackageManager();
    const nodeModulesExists = await hasNodeModulesDirectory();

    if (!nodeModulesExists) {
      throw new DependenciesError(pkgManager);
    }
  }
};

/**
 * Resolves a configuration value based on priority chain:
 * CLI input > Config file > Store > Default
 */
export function resolveConfigPriority<T>({
  inputValue,
  fileValue,
  storeValue,
  defaultValue,
}: ConfigValueOptions<T>): T | undefined {
  // Convert string booleans to actual booleans
  const convertBoolean = (value: unknown): unknown => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  };

  const resolvedValue = inputValue ?? fileValue ?? storeValue ?? defaultValue;
  return convertBoolean(resolvedValue) as T;
}

/**
 * Resolves preset configuration with special handling for preset objects:
 * 1. Preset object from config file
 * 2. Preset object from store
 * 3. String values following standard priority chain
 */
export function resolvePresetPriority({
  inputValue,
  fileValue,
  storeValue,
  defaultValue,
}: PresetValueOptions): PresetInput | undefined {
  // If fileValue is an AzionBuildPreset object, return it with highest priority
  if (typeof fileValue === 'object' && fileValue.metadata?.name) {
    return fileValue;
  }

  // If store has a preset object, return it with second priority
  if (typeof storeValue === 'object' && storeValue.metadata?.name) {
    return storeValue;
  }

  // Otherwise, handle as string values with standard priority order
  return resolveConfigPriority({
    inputValue,
    fileValue,
    storeValue,
    defaultValue,
  });
}

/**
 * Normalizes entry points to a consistent array format
 */
export const normalizeEntryPaths = (entry: BuildEntryPoint): string[] => {
  if (!entry) return [];
  if (typeof entry === 'string') return [entry];
  if (Array.isArray(entry)) return entry;
  return Object.values(entry);
};

/**
 * Converts the output path of a built entry (e.g. ".edge/functions/index") into the `path`
 * of a function in azion.config (e.g. "./functions/index.js").
 */
const toFunctionPath = (outputPath: string): string => {
  const finalOutputPath = outputPath.endsWith('.js') ? outputPath : `${outputPath}.js`;
  // Dev builds append a ".dev" suffix to the output filename, which never matches the
  // production path declared in azion.config — strip it before comparing.
  const withoutDevSuffix = finalOutputPath.replace(/\.dev\.js$/, '.js');
  return `./${relative(DIRECTORIES.OUTPUT_BASE_PATH, withoutDevSuffix)}`;
};

/**
 * The `functions[].path` values of azion.config that the build of an entry generates, in the order of
 * the entries. The output name comes from the entry (e.g. "index.js" generates "./functions/index.js").
 */
export const getFunctionPathsFromEntry = async (entry: BuildEntryPoint): Promise<string[]> => {
  const entryPathsMap = await createPathEntriesMap({ entry });
  return Object.keys(entryPathsMap).map(toFunctionPath);
};

/** A single entry is shown as a string (the CLI hands over `--entry index.js` as a one item array) */
const formatEntry = (entry: BuildEntryPoint): string => {
  const single = Array.isArray(entry) && entry.length === 1 ? entry[0] : entry;
  return typeof single === 'string' ? `"${single}"` : JSON.stringify(single);
};

/**
 * Verifies that each function's declared `path` matches the file actually generated
 * by the build entry, since the real output name comes from the build entry, not from
 * the preset/user config. Throws if a mismatch is found.
 *
 * @param entry - Map of the generated output paths of the build
 * @param functions - The functions of azion.config
 * @param buildEntry - The `build.entry` the build ran with, shown next to the path to make the difference clear
 */
export const verifyFunctionsOutputPath = (
  entry: Record<string, string>,
  functions?: AzionFunction[],
  buildEntry?: BuildEntryPoint,
): void => {
  const generatedPaths = Object.keys(entry).map(toFunctionPath);

  const mismatchedFunctions = (functions ?? [])
    .map((func, index) => ({ func, index }))
    .filter(({ func }) => func.path && !generatedPaths.includes(func.path));

  if (mismatchedFunctions.length === 0) return;

  /** The configured path and the build.entry side by side, so the difference can be seen at a glance */
  const compare = (index: number, configuredPath: string, generated: string[]) => {
    if (!buildEntry) return '';
    const pathLabel = `functions[${index}].path`;
    const entryLabel = 'build.entry';
    const width = Math.max(pathLabel.length, entryLabel.length);
    const generates = generated.map((path) => `"${path}"`).join(', ');
    return (
      `\n      ${pathLabel.padEnd(width)}  "${configuredPath}"` +
      `\n      ${entryLabel.padEnd(width)}  ${formatEntry(buildEntry)} (generates ${generates})`
    );
  };

  const details = mismatchedFunctions
    .map(({ func, index }) => {
      const configuredPath = func.path as string;
      const generatedPath = generatedPaths[index];
      if (generatedPath) {
        return (
          `  - functions[${index}] ("${func.name}"): configured path "${configuredPath}" ` +
          `does not match generated output "${join(DIRECTORIES.OUTPUT_BASE_PATH, generatedPath)}". ` +
          `Update the path to "${generatedPath}" in azion.config` +
          compare(index, configuredPath, [generatedPath])
        );
      }
      const allGeneratedPaths = generatedPaths.map((path) => `"${path}"`).join(', ');
      return (
        `  - functions[${index}] ("${func.name}"): configured path "${configuredPath}" ` +
        `does not match any generated output. Update the path in azion.config to one of: ${allGeneratedPaths}` +
        compare(index, configuredPath, generatedPaths)
      );
    })
    .join('\n');

  throw new Error(
    `The "path" declared for the following function(s) in azion.config does not match the file(s) generated by the build:\n${details}\n` +
      `The build does not change your azion.config automatically. Adjust "build.entry" and "functions[].path" in it so that they match.`,
  );
};

/**
 * Cleans and recreates directories
 */
export const cleanDirectory = async (dirs: string[]): Promise<void> => {
  try {
    await Promise.all(
      dirs.map(async (dir) => {
        try {
          await rm(dir, { recursive: true, force: true });
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw err;
          }
        }
        await mkdir(dir, { recursive: true });
      }),
    );
  } catch (error) {
    // eslint-disable-next-line preserve-caught-error -- message already embeds the original error
    throw new Error(`Failed to clean directories: ${error}`);
  }
};
