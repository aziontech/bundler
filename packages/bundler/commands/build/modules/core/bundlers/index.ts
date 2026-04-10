import {
  createAzionESBuildConfig,
  executeESBuildBuild,
  createAzionWebpackConfig,
  executeWebpackBuild,
} from '@aziontech/builder';
import { BuildConfiguration, BuildContext } from '@aziontech/config';

export const createAzionESBuildConfigWrapper = (
  buildConfig: BuildConfiguration,
  ctx: BuildContext,
) => {
  return createAzionESBuildConfig(buildConfig, ctx);
};

export const createAzionWebpackConfigWrapper = (
  buildConfig: BuildConfiguration,
  ctx: BuildContext,
) => {
  return createAzionWebpackConfig(buildConfig, ctx);
};

export const executeESBuildBuildWrapper = async (
  esbuildConfig: ReturnType<typeof createAzionESBuildConfig>,
) => {
  return executeESBuildBuild(esbuildConfig);
};

export const executeWebpackBuildWrapper = async (
  webpackConfig: ReturnType<typeof createAzionWebpackConfig>,
) => {
  return executeWebpackBuild(webpackConfig);
};

export default {
  createAzionESBuildConfigWrapper,
  createAzionWebpackConfigWrapper,
  executeESBuildBuildWrapper,
  executeWebpackBuildWrapper,
};
