import { createPromptModule } from 'inquirer';

import { Messages } from '#constants';
import { feedback, debug } from '#utils';
import { Commands } from '#namespaces';

const prompt = createPromptModule();

/**
 * @function
 * @memberof Commands
 * @description Manages presets for the application.
 * This command allows the user to create or list presets.
 * The user is guided by a series of prompts to enter a preset name.
 * @param {string} command - The operation to be performed:
 * 'create' to create a preset, 'ls' to list presets.
 * @returns {Promise<void>} - A promise that resolves when the action is complete.
 * @example
 *
 * // To create a new preset
 * presetsCommand('create');
 *
 * // To list existing presets
 * presetsCommand('ls');
 */
async function presetsCommand(command) {
  const { presets } = await import('#utils');

  let name;

  switch (command) {
    case 'create':
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { inputPresetName } = await prompt([
          {
            type: 'input',
            name: 'inputPresetName',
            message: 'Enter the preset name:',
          },
        ]);

        const presetExists = presets
          .getKeys()
          .map((existingPresetName) => existingPresetName.toLowerCase())
          .includes(inputPresetName.toLowerCase());

        if (presetExists) {
          feedback.error('A preset with this name already exists.');
        } else if (!inputPresetName) {
          feedback.error('Preset name cannot be empty.');
        } else {
          name = inputPresetName;
          break;
        }
      }

      try {
        presets.set(name);
        feedback.success(`${name} created with success!`);
        feedback.info(
          `Now open './lib/presets/${name}' and work on your preset.`,
        );
      } catch (error) {
        debug.error(error);
        feedback.error(Messages.errors.folder_creation_failed(name));
      }
      break;

    case 'ls':
      presets.getBeautify().forEach((preset) => feedback.option(preset));

      break;

    default:
      feedback.error('Invalid argument provided.');
      break;
  }
}

export default presetsCommand;
