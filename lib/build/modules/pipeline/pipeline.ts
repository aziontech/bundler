import { createAzionESBuildConfig, executeESBuildBuild } from '../../../bundlers/esbuild/esbuild';
import { createAzionWebpackConfig, executeWebpackBuild } from '../../../bundlers/webpack/webpack';
import { BuildConfig, PresetFiles } from '../../../types/bundler';

interface BuildEnv {
  production: boolean;
  output: string;
}

export const executeBuildPipeline = async (
  buildConfig: BuildConfig,
  presetFiles: PresetFiles,
  env: BuildEnv,
): Promise<void> => {
  // Execute prebuild
  const prebuildResult = await executePrebuild(buildConfig, presetFiles);

  const bundler = buildConfig.builder?.toLowerCase() || 'webpack';

  switch (bundler) {
    case 'esbuild': {
      const esbuildConfig = createAzionESBuildConfig(buildConfig, env);
      await executeESBuildBuild(esbuildConfig.baseConfig);
      break;
    }
    case 'webpack': {
      const webpackConfig = createAzionWebpackConfig(buildConfig, env);
      await executeWebpackBuild(webpackConfig);
      break;
    }
    default:
      throw new Error(`Unsupported bundler: ${bundler}`);
  }

  // Execute postbuild if available
  if (presetFiles.postbuild) {
    await presetFiles.postbuild(buildConfig);
  }
};
