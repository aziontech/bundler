import { join } from 'path';
import fs from 'fs';
import { existsSync, readdirSync } from 'fs';
import { extname } from 'path';

import type { AzionBuildPreset } from 'azion/config';
import * as presets from 'azion/presets';
import { getPackageManager } from 'azion/utils/node';
import type { PackageJson } from './types';
import { ConfigValueOptions, PresetValueOptions } from './types';
import { PresetInput } from 'azion/config';

// @ts-expect-error - Types are not properly exported
import { listFrameworks } from '@netlify/framework-info';

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

export const readPackageJson = (): PackageJson => {
  const packageJsonPath = join(process.cwd(), 'package.json');
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    return JSON.parse(content);
  } catch (error: unknown) {
    throw new PackageJsonError(
      'Failed to read package.json',
      (error as { code?: string }).code,
    );
  }
};

export const hasNodeModulesDirectory = async (): Promise<boolean> => {
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  try {
    const stats = await fs.promises.stat(nodeModulesPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
};

export const checkDependencies = async (): Promise<void> => {
  let projectJson: PackageJson;

  try {
    projectJson = readPackageJson();
  } catch (error) {
    if (error instanceof PackageJsonError && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  if (
    projectJson &&
    (projectJson.dependencies || projectJson.devDependencies)
  ) {
    const pkgManager = await getPackageManager();
    const nodeModulesExists = await hasNodeModulesDirectory();

    if (!nodeModulesExists) {
      throw new DependenciesError(pkgManager);
    }
  }
};

/**
 * Detects project type by analyzing package.json dependencies
 * @returns The detected preset name based on project dependencies
 */
export async function inferPreset(): Promise<string> {
  try {
    // Try framework detection with @netlify/framework-info
    const detectedFramework = await listFrameworks({
      projectDir: process.cwd(),
    });
    if (detectedFramework[0]?.id) {
      const hasPreset = Object.values(presets).some(
        (preset: AzionBuildPreset) =>
          preset.metadata?.registry === detectedFramework[0].id,
      );
      if (hasPreset) return detectedFramework[0].id;
    }

    // Check for TypeScript
    const tsConfigPath = join(process.cwd(), 'tsconfig.json');
    const tsConfigExists = existsSync(tsConfigPath);
    if (tsConfigExists) return 'typescript';

    const files = readdirSync(process.cwd());
    const hasTypeScriptFiles = files.some((file) =>
      ['.ts', '.tsx'].includes(extname(file)),
    );
    if (hasTypeScriptFiles) return 'typescript';

    return 'javascript';
  } catch (error) {
    return 'javascript';
  }
}

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
  return inputValue ?? fileValue ?? storeValue ?? defaultValue;
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
