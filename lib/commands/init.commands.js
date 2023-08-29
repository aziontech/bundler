import { createPromptModule } from 'inquirer';
import { FrameworkInitializer, Messages } from '#constants';
import { feedback } from '#utils';

const prompt = createPromptModule();
/**
 *
 * @param options
 * @param options.name
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
