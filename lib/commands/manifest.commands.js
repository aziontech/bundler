import { readFileSync, writeFileSync } from 'fs';
import { resolve, extname } from 'path';
import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { Messages } from '#constants';
import { convertJsonConfigToObject } from 'azion';

import { Commands } from '#namespaces';
/**
 * @function manifestCommand
 * @memberof Commands
 * @description
 * transforms a JSON manifest file to a JavaScript module.
 *
 * Usage:
 * ```bash
 * az manifest transform <input.json> -o <output.js>
 * ```
 *
 * Example:
 * ```bash
 * az manifest transform .edge/manifest.json -o azion.config.js
 * ```
 * @param {string} command - The operation to perform (only 'transform' for now)
 * @param {string} entry - Path to the input JSON file
 * @param {object} options - Command options
 * @param {string} options.output - Output file path for JS module
 */
async function manifestCommand(command, entry, options) {
  try {
    if (command !== 'transform') {
      feedback.error('Only transform command is supported');
      process.exit(1);
    }

    if (!entry) {
      feedback.error('Input file path is required');
      process.exit(1);
    }

    if (!options.output) {
      feedback.error('Output file path is required (--output)');
      process.exit(1);
    }

    const fileExtension = extname(entry).toLowerCase();
    if (fileExtension !== '.json') {
      feedback.error('Input file must be .json');
      process.exit(1);
    }

    const absolutePath = resolve(process.cwd(), entry);
    const jsonString = readFileSync(absolutePath, 'utf8');
    const config = convertJsonConfigToObject(jsonString);

    const jsContent = `export default ${JSON.stringify(config, null, 2)};`;
    writeFileSync(options.output, jsContent);

    feedback.success(
      `Azion Platform configuration transformed into JavaScript module at ${options.output}`,
    );
  } catch (error) {
    debug.error(error);
    feedback.error(Messages.errors.unknown_error);
    process.exit(1);
  }
}

export default manifestCommand;
