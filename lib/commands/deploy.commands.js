import { join } from 'path';
import { createPromptModule } from 'inquirer';

const prompt = createPromptModule();

/**
 *
 */
async function deployCommand() {
  const { core } = await import('#platform');
  const { getVulcanBuildId } = await import('#utils');

  const versionId = getVulcanBuildId();
  const staticsPath = join(process.cwd(), '/.edge/storage');

  const answers = await prompt([
    {
      type: 'input',
      name: 'applicationName',
      message:
          'Enter the name of the application (optional, leave empty for random name):',
    },
    {
      type: 'input',
      name: 'functionName',
      message:
          'Enter the name of the function (optional, leave empty for random name):',
    },
  ]);

  const { applicationName, functionName } = answers;

  await core.actions.uploadStatics(versionId, staticsPath);
  const domain = await core.actions.deploy(applicationName, functionName);
  core.actions.watchPropagation(domain);
}

export default deployCommand;
