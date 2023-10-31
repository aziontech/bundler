import { join } from 'path';
import { existsSync } from 'fs';
import inquirer, { createPromptModule } from 'inquirer';
import {
  FrameworkInitializer,
  FrameworksDefaultVersions,
  Messages,
} from '#constants';
import { feedback, debug } from '#utils';
import { vulcan } from '#env';

import { Commands } from '#namespaces';

const prompt = createPromptModule();

/**
 * @function
 * @memberof Commands
 * @description Initializes a new project based on the selected framework template.
 * @param {object} options - Configuration options for initialization.
 * @param {string} options.name - Name of the new project.
 * If not provided, the function will prompt for it.
 * @example
 * initCommand({ name: 'my_new_project' });
 */
async function initCommand({ name }) {
  try {
    const AVALIABLE_TEMPLATES = Object.keys(FrameworkInitializer);
    let projectName = name;

    const { frameworkChoice } = await prompt([
      {
        type: 'list',
        name: 'frameworkChoice',
        message: 'Choose a template for your project:',
        choices: AVALIABLE_TEMPLATES,
      },
    ]);

    const frameworkOptions =
      FrameworksDefaultVersions[frameworkChoice].options || [];

    const versionChoices = frameworkOptions
      .map((option) => ({
        name: `${option.value} (${option.message})`,
        value: option.value,
      }))
      .concat([
        new inquirer.Separator(),
        { name: 'Custom version', value: 'custom' },
      ]);

    const { frameworkVersion } = await prompt([
      {
        type: 'list',
        name: 'frameworkVersion',
        message: `Choose a version for ${frameworkChoice}:`,
        choices: versionChoices,
        default: FrameworksDefaultVersions[frameworkChoice],
      },
    ]);

    let chosenVersion = frameworkVersion;

    if (frameworkVersion === 'custom') {
      const { customVersion } = await prompt([
        {
          type: 'input',
          name: 'customVersion',
          message: `Enter the version for ${frameworkChoice}:`,
          validate: (input) => {
            if (input.trim() === '') return 'Version cannot be empty!';
            return true;
          },
        },
      ]);
      chosenVersion = customVersion;
    }

    while (!projectName) {
      const dirExists = (dirName) => existsSync(join(process.cwd(), dirName));

      // eslint-disable-next-line no-await-in-loop
      const { projectName: inputName } = await prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Enter your project name:',
        },
      ]);

      if (inputName && !dirExists(inputName)) {
        projectName = inputName;
      } else if (dirExists(inputName)) {
        feedback.pending(Messages.errors.folder_name_already_exists(inputName));
      } else {
        feedback.pending(Messages.info.name_required);
      }
    }

    const createFrameworkTemplate = FrameworkInitializer[frameworkChoice];
    if (createFrameworkTemplate) {
      const dest = join(process.cwd(), projectName);
      await createFrameworkTemplate(projectName, chosenVersion);
      await vulcan.createVulcanEnv(
        { preset: frameworkChoice.toLowerCase() },
        dest,
      );
    } else {
      feedback.error(Messages.errors.invalid_choice);
    }
  } catch (error) {
    debug.error(error);
  }
}

export default initCommand;
