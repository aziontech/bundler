import fsPromises from 'fs/promises';
import { dirname } from 'path';
import { BuildConfiguration, BuildContext } from 'azion/config';
import util from './utils';

/**
 * Configures the worker code based on user input
 *
 * @param buildConfig - Build configuration
 * @param ctx - Build context with input/output information
 * @returns The generated or original worker code
 */
export const setupWorkerCode = async (
  buildConfig: BuildConfiguration,
  ctx: BuildContext,
): Promise<string> => {
  try {
    if (buildConfig.worker) {
      return fsPromises.readFile(ctx.entrypoint, 'utf-8');
    }
    const wrapperCode = util.createEventHandlerCode(ctx.entrypoint);

    await fsPromises.mkdir(dirname(ctx.output), { recursive: true });

    if (ctx.production !== false) {
      await fsPromises.writeFile(ctx.output, wrapperCode, 'utf-8');
    }

    return wrapperCode;
  } catch (error: unknown) {
    throw new Error(
      `Failed to setup worker code: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
