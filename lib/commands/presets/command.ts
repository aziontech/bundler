import { feedback } from 'azion/utils/node';
import { getBeautify } from './presets';

/**
 * @function
 * @description Manages presets for the application.
 * This command allows the user to create or list presets.
 * The user is guided by a series of prompts to enter a preset name.
 * @example
 *
 * // To list existing presets
 * presetsCommand('ls');
 */
export async function presetsCommand(command: string) {
  switch (command) {
    case 'ls':
      getBeautify().forEach((preset: string) => feedback.option(preset));
      break;

    default:
      feedback.error('Invalid argument provided.');
      break;
  }
}
