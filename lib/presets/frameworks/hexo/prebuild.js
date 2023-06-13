import util from 'util';
import { exec } from 'child_process';

const execPromise = util.promisify(exec);

/**
 * Execute a shell command
 * @param {string} command - Command to be executed
 */
async function execCommand(command) {
  try {
    const { stderr } = await execPromise(command);
    console.log(`Running '${command}' ...`);

    if (stderr) {
      console.log(`Error running the command: ${stderr}`);
    }
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}

/**
 * Runs custom prebuild actions
 */
const main = async () => {
  console.log('Running Hexo prebuild actions!');

  await execCommand('npx hexo generate');

  console.log('Prebuild actions done!');
};

export default main;
