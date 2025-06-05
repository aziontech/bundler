import { feedback } from 'azion/utils/node';
import { getBeautify, getKeys, getPresetConfig } from './presets';

/**
 * @function
 * @description Manages presets for the application.
 * This command allows the user to create or list presets.
 * The user is guided by a series of prompts to enter a preset name.
 * @example
 * // To list existing presets
 * presetsCommand('ls');
 *
 * // To get config of a specific preset
 * presetsCommand('config', { preset: 'react' });
 */
export async function presetsCommand(command: string, options: { preset?: string } = {}) {
  const isCleanOutputEnabled = process.env.CLEAN_OUTPUT_MODE === 'true';

  switch (command) {
    case 'ls':
      if (isCleanOutputEnabled) {
        getKeys().forEach((preset: string) => console.log(preset));
      }
      if (!isCleanOutputEnabled) {
        getBeautify().forEach((preset: string) => feedback.option(preset));
      }
      break;

    case 'config':
      if (!options.preset) {
        feedback.error('Preset name is required. Use: ef presets config <preset-name>');
        return;
      }

      try {
        const config = getPresetConfig(options.preset);
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        feedback.error(error instanceof Error ? error.message : 'Unknown error occurred');
      }
      break;

    default:
      feedback.error('Invalid argument provided. Available commands: ls, config');
      break;
  }
}
