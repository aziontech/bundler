import { feedback } from 'azion/utils/node';

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
  const { presets }: any = await import('#utils');

  switch (command) {
    case 'ls':
      presets
        .getBeautify()
        .forEach((preset: string) => feedback.option(preset));

      break;

    default:
      feedback.error('Invalid argument provided.');
      break;
  }
}
