import { join } from 'path';
import fs from 'fs';
import { AzionConfig, AzionPrebuildResult } from 'azion/config';
import { feedback, debug } from '#utils';

import { getPackageManager } from 'azion/utils/node';
import { BuildEnv } from 'azion/bundler';

/* Modules */
import { resolveBuildConfig } from './modules/config';
import { resolvePreset } from './modules/preset';
import { executePrebuild } from './modules/prebuild';
import { executeBuild } from './modules/core';
import { executePostbuild } from './modules/postbuild';
import { generateManifest } from './modules/manifest';

const readPackageJson = () => {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  return JSON.parse(content);
};

const hasNodeModulesDirectory = async (): Promise<boolean> => {
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  try {
    const stats = await fs.promises.stat(nodeModulesPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
};

const checkNodeModules = async () => {
  let projectJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  try {
    projectJson = readPackageJson();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    feedback.prebuild.error(error);
    process.exit(1);
  }

  if (
    projectJson &&
    (projectJson.dependencies || projectJson.devDependencies)
  ) {
    const pkgManager = await getPackageManager();
    const nodeModulesExists = await hasNodeModulesDirectory();

    if (!nodeModulesExists) {
      feedback.prebuild.error(
        `Please install dependencies using ${pkgManager}`,
      );
      process.exit(1);
    }
  }
};

/**
 * Main build function
 */
export const build = async (
  config: AzionConfig,
  ctx: BuildEnv,
): Promise<void> => {
  try {
    await checkNodeModules();
    const preset = await resolvePreset(config.build?.preset);
    const { build: buildConfig } = resolveBuildConfig(config);

    // Execute build phases
    const prebuildResult: AzionPrebuildResult = await executePrebuild(
      buildConfig,
      preset,
      ctx,
    );
    await executeBuild({
      buildConfig,
      preset,
      prebuildResult,
      ctx,
    });
    await executePostbuild(buildConfig, preset);

    await generateManifest(config);
  } catch (error: unknown) {
    debug.error(error);
    feedback.build.error((error as Error).message);
    process.exit(1);
  }
};

export default build;
