import { join } from 'path';
import fs from 'fs';
import { AzionConfig } from 'azion/config';
import { createBuildConfig } from './modules/config';
import { loadPreset, validatePreset } from './modules/preset';
import { executeBuildPipeline } from './modules/pipeline';
import { generateManifest } from './modules/manifest';
import { feedback, debug, getPackageManager, getProjectJsonFile } from '#utils';
import { BuildEnv } from 'azion/bundler';
import { Messages } from '#constants';

async function folderExistsInProject(folder: string): Promise<boolean> {
  const filePath = join(process.cwd(), folder);
  try {
    const stats = await fs.promises.stat(filePath);
    return Promise.resolve(stats.isDirectory());
  } catch (error) {
    return Promise.resolve(false);
  }
}

const checkNodeModules = async () => {
  let projectJson;
  try {
    projectJson = getProjectJsonFile('package.json');
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
    const existNodeModules = await folderExistsInProject('node_modules');

    if (!existNodeModules) {
      feedback.prebuild.error(
        Messages.build.error.install_dependencies_failed(pkgManager),
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
