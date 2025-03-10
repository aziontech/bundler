import { join } from 'path';
import fs from 'fs';
import { existsSync, readdirSync } from 'fs';
import { extname } from 'path';

import type { AzionBuildPreset } from 'azion/config';
import * as presets from 'azion/presets';
import { getPackageManager } from 'azion/utils/node';
import type { PackageJson } from './types';

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
