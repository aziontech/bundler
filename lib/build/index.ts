import { join } from 'path';
import fs from 'fs';
import { AzionConfig } from 'azion/config';
import { feedback, debug } from '#utils';

import { getPackageManager } from 'azion/utils/node';
import { BuildEnv } from 'azion/bundler';

/* Modules */
import { createBuildConfig } from './modules/config';
import { loadPreset, validatePreset } from './modules/preset';
import { executeBuildPipeline } from './modules/pipeline';
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
    // Check node_modules
    await checkNodeModules();

    // Load and validate preset
    const preset =
      typeof config.build?.preset === 'string'
        ? await loadPreset(config.build.preset)
        : config.build?.preset;

    validatePreset(preset);

    // Create build config
    const buildConfig = createBuildConfig(config);

    // Execute build pipeline
    await executeBuildPipeline(buildConfig.build, preset, ctx);

    // Generate manifest
    await generateManifest(config);
  } catch (error: unknown) {
    debug.error(error);
    feedback.build.error((error as Error).message);
    process.exit(1);
  }
};

export default build;
