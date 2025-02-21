import { AzionBuild, AzionBuildPreset } from 'azion/config';
import { feedback } from '#utils';

export const executePostbuild = async (
  buildConfig: AzionBuild,
  preset: AzionBuildPreset,
): Promise<void> => {
  if (preset.postbuild) {
    feedback.postbuild.info('Running post-build actions...');
    await preset.postbuild(buildConfig);
  }
};
