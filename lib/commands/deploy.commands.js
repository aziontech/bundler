import { join } from 'path';
import { createPromptModule } from 'inquirer';

const prompt = createPromptModule();
/**
 * A Command to deploy a web application.
 * @memberof commands
 * This command will ask for the application name and function name via the terminal.
 * Then, it will upload static files and deploy the application.
 * Finally, it watches for the propagation of the deployment.
 * @returns {Promise<void>} - A promise that resolves when the deployment is complete.
 * @example
 *
 * deployCommand();
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
