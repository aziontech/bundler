import { feedback } from '#utils';
import { execCommandInContainer } from './docker-env-actions.js';

/**
 * Stop bundler server in test container
 * @param {number} serverPort - used port in bundler server
 * @param {string} example - current example name
 */
async function projectStop(serverPort, example) {
  feedback.info(`[${example}] Stopping Bundler local server ...`);
  await execCommandInContainer(`pkill -9 -f "dev -p ${serverPort}"`);

  feedback.info(`[${example}] Bundler local server stopped!`);
}

export default projectStop;
