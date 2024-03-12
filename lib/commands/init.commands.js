import { join } from 'path';
import { existsSync } from 'fs';
import inquirer, { createPromptModule } from 'inquirer';
import { TemplatesInitializer, TemplatesOptions, Messages } from '#constants';
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
    const AVAILABLE_TEMPLATES = Object.keys(TemplatesInitializer);
    let projectName = name;

    const { frameworkChoice } = await prompt([
      {
        type: 'list',
        name: 'frameworkChoice',
        message: 'Choose a template for your project:',
        choices: AVAILABLE_TEMPLATES,
        pageSize: AVAILABLE_TEMPLATES.length,
      },
    ]);

    const templateOptions = TemplatesOptions[frameworkChoice]?.options || [];
    let templatePath;

    if (templateOptions.length > 1) {
      const { templateChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'templateChoice',
          message: 'Choose the template:',
          choices: templateOptions.map((option) => ({
            name: option.message,
            value: option.value,
          })),
        },
      ]);
      templatePath = templateChoice;
    } else {
      templatePath = templateOptions[0]?.value;
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

    const createFrameworkTemplate = TemplatesInitializer[frameworkChoice];
    if (createFrameworkTemplate) {
      const dest = join(process.cwd(), projectName);
      await createFrameworkTemplate(projectName, templatePath);
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
