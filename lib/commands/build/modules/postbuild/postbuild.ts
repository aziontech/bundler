import { BuildConfiguration, BuildContext } from 'azion/config';

export interface PostbuildParams {
  buildConfig: BuildConfiguration;
  ctx: BuildContext;
}

export const executePostbuild = async ({ buildConfig, ctx }: PostbuildParams): Promise<void> => {
  const { postbuild } = buildConfig.preset;
  if (postbuild) {
    await postbuild(buildConfig, { ...ctx });
  }
};
