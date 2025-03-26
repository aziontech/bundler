import { BuildConfiguration, BuildContext } from 'azion/config';

export interface PostbuildParams {
  buildConfig: BuildConfiguration;
  ctx: BuildContext;
}

export const executePostbuild = async ({
  buildConfig,
  ctx,
}: PostbuildParams): Promise<void> => {
  const { postbuild } = buildConfig.preset;
  if (postbuild) {
    const outputWorker =
      ctx.production === false
        ? ctx.output.replace('.js', '.dev.js')
        : ctx.output;

    await postbuild(buildConfig, { ...ctx, output: outputWorker });
  }
};
