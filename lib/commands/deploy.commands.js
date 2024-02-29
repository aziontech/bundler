import { join } from 'path';
import { createPromptModule } from 'inquirer';
import { promises as fs } from 'fs';

import { Commands } from '#namespaces';

const prompt = createPromptModule();
/**
 * Checks whether a directory exists.
 * @param {string} dirPath - The directory path to check.
 * @returns {Promise<boolean>} - Returns true if the directory exists, false otherwise.
 */
async function directoryExists(dirPath) {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * @function
 * @memberof Commands
 * @description A Command to deploy a web application.
 * This command will ask for the application name and function name via the terminal.
 * Then, it will upload static files and deploy the application.
 * Finally, it watches for the propagation of the deployment.
 * @returns {Promise<void>} - A promise that resolves when the deployment is complete.
 * @param {string} functionID - Function ID will be updated.
 * @example
 *
 * deployCommand();
 */
async function deployCommand(functionID) {
  const { core, functions } = await import('#platform');
  const { getVulcanBuildId } = await import('#utils');

  const versionId = getVulcanBuildId();
  const staticsPath = join(process.cwd(), '/.edge/storage');

  if (functionID) {
    if (await directoryExists(staticsPath)) {
      await core.actions.uploadStatics(versionId, staticsPath);
    }
    await functions.actions.updateFunction(functionID);
  }
  if (!functionID) {
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

    if (await directoryExists(staticsPath)) {
      await core.actions.uploadStatics(versionId, staticsPath);
    }

    const domain = await core.actions.deploy(applicationName, functionName);
    core.actions.watchPropagation(domain);
  }
}

export default deployCommand;
