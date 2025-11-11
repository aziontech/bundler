import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { generateManifest, transformManifest } from './manifest';
import { AzionConfig } from 'azion/config';
import { rm } from 'fs/promises';
import { DIRECTORIES, DOCS_MESSAGE } from '#constants';

export enum ManifestAction {
  GENERATE = 'generate',
  TRANSFORM = 'transform',
}

export interface ManifestCommandOptions {
  action?: ManifestAction | string;
  entry?: string;
  config?: AzionConfig;
  output?: string;
}

/**
 * @function manifestCommand
 * @description
 * Manages manifest operations for generation and transformation.
 *
 * Usage:
 * ```bash
 * az manifest transform --entry=<input.json> --output=<output.js>
 * az manifest generate --entry=<input.config.js> --output=<output.dir>
 * az manifest --entry=<input.config.js> --output=<output.dir>
 * ```
 */
export async function manifestCommand(options: ManifestCommandOptions): Promise<void> {
  try {
    const action = options.action || ManifestAction.GENERATE;

    const actionHandlers = {
      [ManifestAction.GENERATE]: async () => {
        const input = options.entry || options.config;
        await generateManifest(input, options.output);
      },

      [ManifestAction.TRANSFORM]: async () => {
        await transformManifest(options.entry, options.output);
      },
    };

    // Execute the appropriate handler or show error
    const handler = actionHandlers[action as ManifestAction];

    if (handler) {
      await handler();
    }
    if (!handler) {
      feedback.manifest.error(
        `Only ${ManifestAction.TRANSFORM} and ${ManifestAction.GENERATE} actions are supported`,
      );
      process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (debug as any).error(error);
    feedback.error(`${error instanceof Error ? error.message : String(error)}${DOCS_MESSAGE}`);
    await rm(DIRECTORIES.OUTPUT_BASE_PATH, { recursive: true, force: true });
    process.exit(1);
  }
}
