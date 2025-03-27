import fsPromises from 'fs/promises';
import { dirname } from 'path';
import {
  BuildConfiguration,
  BuildContext,
  BuildEntryPoint,
} from 'azion/config';
import util from './utils';

const resolveEntryPoints = (entry: BuildEntryPoint): string[] => {
  if (typeof entry === 'string') return [entry];
  if (Array.isArray(entry)) return entry;
  return Object.values(entry);
};

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
): Promise<string[]> => {
  try {
    const entrypoints = resolveEntryPoints(ctx.entrypoint);
    const tempEntrypoints = resolveEntryPoints(buildConfig.entry);

    if (buildConfig.worker) {
      const contents = await Promise.all(
        entrypoints.map((entry) => fsPromises.readFile(entry, 'utf-8')),
      );

      // Write worker files to temp location
      await Promise.all(
        tempEntrypoints.map(async (tempEntry, index) => {
          await fsPromises.mkdir(dirname(tempEntry), { recursive: true });
          await fsPromises.writeFile(tempEntry, contents[index], 'utf-8');
        }),
      );

      return contents;
    }

    const processEntry = async (entry: string, tempEntry: string) => {
      const wrapperCode = util.createEventHandlerCode(entry);

      // Write worker file to temp location
      await fsPromises.mkdir(dirname(tempEntry), { recursive: true });
      await fsPromises.writeFile(tempEntry, wrapperCode, 'utf-8');

      return wrapperCode;
    };

    return Promise.all(
      entrypoints.map((entry, index) =>
        processEntry(entry, tempEntrypoints[index]),
      ),
    );
  } catch (error: unknown) {
    throw new Error(
      `Failed to setup worker code: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
