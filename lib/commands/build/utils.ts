import { join } from 'path';
import { readFile, stat, rm, mkdir } from 'fs/promises';
import { getPackageManager } from 'azion/utils/node';
import type { ConfigValueOptions, PresetValueOptions, PackageJson } from './types';
import type { PresetInput, BuildEntryPoint } from 'azion/config';

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
  } catch (error) {
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
    throw new Error(`Failed to clean directories: ${error}`);
  }
};
