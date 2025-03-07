import { readFile } from 'fs/promises';
import { BuildConfiguration, BuildContext } from 'azion/config';
import { transpileTypescript } from './utils';
import { WORKER_TEMPLATES } from './constants';

export const setupWorkerCode = async (
  buildConfig: BuildConfiguration,
  ctx: BuildContext,
): Promise<string> => {
  // If worker signature is already present, return the source code without any transformations
  if (buildConfig.worker) return readFile(ctx.entrypoint, 'utf-8');

  const sourceCode = await readFile(ctx.entrypoint, 'utf-8');
  const moduleCode =
    buildConfig.preset.metadata.ext === '.ts'
      ? transpileTypescript(sourceCode)
      : sourceCode;

  const tempUrl =
    'data:text/javascript;base64,' + Buffer.from(moduleCode).toString('base64');
  const module = await import(tempUrl);

  const handler = module[ctx.event] || module.default?.[ctx.event];

  if (!handler) {
    throw new Error(`Handler for ${ctx.event} not found in module`);
  }

  return WORKER_TEMPLATES[ctx.event](handler.toString());
};
