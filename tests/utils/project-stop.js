import { exec } from '#utils';

/**
 * Stop vulcan server in test container
 */
async function projectStop() {
  // stop server
  await exec(`docker exec test pkill -9 -f dev`);
}

export default projectStop;
