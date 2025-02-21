import { join } from 'path';
import fs from 'fs';
import { getPackageManager } from 'azion/utils/node';

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

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

export const checkDependenciesInstallation = async (): Promise<void> => {
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
