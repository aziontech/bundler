import { createPromptModule } from 'inquirer';
import { FrameworkInitializer, Messages } from '#constants';
import { feedback } from '#utils';

const prompt = createPromptModule();
/**
 * A command to Initializes a new project with the selected framework template.
 * @memberof commands
 * This function prompts the user to select a framework template and enter a project name.
 * Then it initializes a new project based on the selected template.
 * @param {object} options - An object containing the name for the new project.
 * @param {string} options.name - The name of the new project.
 * If not provided, the function will prompt for it.
 * @returns {Promise<void>} - A promise that resolves when the new project is initialized.
 * @example
 *
 * initCommand({ name: 'my_new_project' });
 */
async function initComamnd({ name }) {
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

  while (!projectName) {
    // eslint-disable-next-line no-await-in-loop
    const { projectName: inputName } = await prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Enter your project name:',
      },
    ]);

    if (inputName) {
      projectName = inputName;
    }
    if (!inputName) {
      feedback.pending(Messages.info.name_required);
    }
  }

  const createFrameworkTemplate = FrameworkInitializer[frameworkChoice];

  if (createFrameworkTemplate) {
    await createFrameworkTemplate(projectName);
  } else {
    feedback.error(Messages.errors.invalid_choice);
  }
}

export default initComamnd;
