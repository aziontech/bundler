import { feedback } from '#utils';
import { execCommandInContainer } from './docker-env-actions.js';

/**
 * Stop vulcan server in test container
 * @param {number} serverPort - used port in vulcan server
 * @param {string} example - current example name
 */
async function projectStop(serverPort, example) {
  feedback.info(`[${example}] Stopping vulcan local server ...`);
  await execCommandInContainer(`pkill -9 -f "dev -p ${serverPort}"`);

  feedback.info(`[${example}] vulcan local server stopped!`);
}

export default projectStop;
