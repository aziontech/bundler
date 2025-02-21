import { AzionBuild, AzionBuildPreset } from 'azion/config';

export interface PostbuildParams {
  buildConfig: AzionBuild;
  preset: AzionBuildPreset;
}

export const executePostbuild = async ({
  buildConfig,
  preset,
}: PostbuildParams): Promise<void> => {
  if (preset.postbuild) {
    await preset.postbuild(buildConfig);
  }
};
