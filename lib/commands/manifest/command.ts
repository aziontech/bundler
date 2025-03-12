import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { generateManifest, transformManifest } from './manifest';
import { AzionConfig } from 'azion/config';

export enum ManifestAction {
  GENERATE = 'generate',
  TRANSFORM = 'transform',
}

// Constants for default paths
const DEFAULT_TRANSFORM_INPUT_PATH = '.edge/manifest.json';
const DEFAULT_TRANSFORM_OUTPUT_PATH = 'azion.config.js';

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
export async function manifestCommand(
  options: ManifestCommandOptions,
): Promise<void> {
  try {
    // If action is not specified, infer from context
    const action =
      options.action ||
      (options.config ? ManifestAction.GENERATE : ManifestAction.TRANSFORM);

    switch (action) {
      case ManifestAction.GENERATE:
        const input = options.entry || options.config || undefined;
        await generateManifest(input, options.output);
        break;

      case ManifestAction.TRANSFORM:
        // Use default paths when not specified
        const inputPath = options.entry || DEFAULT_TRANSFORM_INPUT_PATH;
        const outputPath = options.output || DEFAULT_TRANSFORM_OUTPUT_PATH;

        await transformManifest(inputPath, outputPath);
        break;

      default:
        feedback.error(
          `Only ${ManifestAction.TRANSFORM} and ${ManifestAction.GENERATE} actions are supported`,
        );
        process.exit(1);
    }
  } catch (error) {
    (debug as any).error(error);
    feedback.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
