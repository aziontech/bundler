import { join } from 'path';
import { existsSync } from 'fs';
import inquirer, { createPromptModule } from 'inquirer';
import { TemplatesInitializer, TemplatesOptions, Messages } from '#constants';
import { feedback, debug } from '#utils';
import { vulcan } from '#env';

import { Commands } from '#namespaces';

const prompt = createPromptModule();

/**
 * @description Get the selected template from the user
 * @param {Array} templateOptions - Array of template options
 * @param {string} template - Preset to select
 * @returns {object} - The selected template
 */
async function getTemplateSelection(templateOptions, template) {
  if (template) {
    const templateSelectionByLine = templateOptions.find(
      (option) => option.message === template,
    );
    if (templateSelectionByLine) {
      return templateSelectionByLine;
    }
  }

  if (templateOptions.length > 1) {
    const { templateChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateChoice',
        message: 'Choose the template:',
        choices: templateOptions.map((option) => ({
          name: option.message,
          value: option,
        })),
      },
    ]);
    return templateChoice;
  }

  return templateOptions[0]; // Assuming the first option is the default
}

/**
 * @function
 * @memberof Commands
 * @description Initializes a new project based on the selected framework template.
 * @param {object} options - Configuration options for initialization.
 * @param {string} options.template - Template to use for the project.
 * @param {string} options.preset - Preset to use for the project.
 * @param {string} options.name - Name of the new project.
 * If not provided, the function will prompt for it.
 * @example
 * initCommand({ name: 'my_new_project' });
 */
async function initCommand({ name, template, preset }) {
  try {
    const AVAILABLE_PRESETS = Object.keys(TemplatesInitializer);
    let projectName = name;
    let templateOptions = [];
    let frameworkChoice;
    const isPresetAvailable = AVAILABLE_PRESETS.find((t) => t === preset);

    console.log(isPresetAvailable);

    if (!isPresetAvailable && preset) {
      feedback.error(
        'The option entered does not exist, please select one of the options below.',
      );
    }

    if (!isPresetAvailable) {
      const { frameworkChoiceOps } = await prompt([
        {
          type: 'list',
          name: 'frameworkChoiceOps',
          message: 'Choose a preset for your project:',
          choices: AVAILABLE_PRESETS,
          pageSize: AVAILABLE_PRESETS.length,
        },
      ]);
      frameworkChoice = frameworkChoiceOps;
    } else {
      frameworkChoice = preset;
    }
    templateOptions = TemplatesOptions[frameworkChoice]?.options || [];

    const templateSelection = await getTemplateSelection(
      templateOptions,
      template,
    );

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

    const createFrameworkTemplate = TemplatesInitializer[frameworkChoice];
    if (createFrameworkTemplate) {
      const dest = join(process.cwd(), projectName);
      feedback.interactive.await(Messages.init.info.preparing);
      await createFrameworkTemplate(projectName, templateSelection.value);
      feedback.interactive.success(Messages.init.success.ready);
      await vulcan.createVulcanEnv(
        { preset: frameworkChoice.toLowerCase(), mode: templateSelection.mode },
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
