import { createPromptModule } from 'inquirer';
import { Messages } from '#constants';
import { feedback, debug } from '#utils';

const prompt = createPromptModule();

/**
 *
 * @param command
 */
async function presetsCommand(command) {
  const { presets } = await import('#utils');

  let name;
  let mode;

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

      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { inputMode } = await prompt([
          {
            type: 'list',
            name: 'inputMode',
            message: 'Choose the mode:',
            choices: ['compute', 'deliver'],
          },
        ]);

        if (['compute', 'deliver'].includes(inputMode)) {
          mode = inputMode;
          break;
        } else {
          feedback.error('Invalid mode. Choose either "compute" or "deliver".');
        }
      }

      try {
        presets.set(name, mode);
        feedback.success(`${name}(${mode}) created with success!`);
        feedback.info(`Now open './lib/presets/${name}/${mode}' and work on your preset.`);
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
