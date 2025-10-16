import { feedback } from 'azion/utils/node';
import { execCommandInContainer } from './docker-env-actions.js';

/**
 * Stop bundler server in test container
 * @param {number} serverPort - used port in bundler server
 * @param {string} example - current example name
 */
async function projectStop(serverPort, example, examplePath) {
  feedback.info(`[${example}] Stopping Bundler local server ...`);
  await execCommandInContainer(`pkill -9 -f "dev -p ${serverPort}"`);
  // cleanup
  await execCommandInContainer(`rm -rf ${examplePath}/.next`);
  await execCommandInContainer(`rm -rf ${examplePath}/.vercel`);
  await execCommandInContainer(`rm -rf ${examplePath}/.edge`);
  await execCommandInContainer(`rm -rf ${examplePath}/.nuxt`);
  await execCommandInContainer(`rm -rf ${examplePath}/node_modules`);
  feedback.info(`[${example}] Cleaned up! ✅`);
  feedback.info(`[${example}] Bundler local server stopped!`);
}

export default projectStop;
