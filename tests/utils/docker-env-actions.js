import { exec } from '#utils';

/**
 * Sleep for n ms
 * @param {number} ms - time to sleep
 * @returns {any} - Resolved promise after timeout
 */
function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a process is running
 * @param {string} processName - process to check
 * @param {string} containerName - container to check
 * @returns {Promise<boolean>} - a promise of a boolean indicating if the process is running
 */
async function isProcessRunning(processName, containerName = 'test') {
  try {
    await exec(
      `docker exec ${containerName} ps aux | grep -v grep | grep "${processName}"`,
    );
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Wait for vulcan to start or stop server
 * @param {boolean} checkStart - is a server start? otherwise will wait for stop
 */
async function waitForVulcanServer(checkStart) {
  let isRunning = false;

  if (checkStart) {
    while (!isRunning) {
      // eslint-disable-next-line no-await-in-loop
      isRunning = await isProcessRunning('dev');
    }
  } else {
    isRunning = true;
    while (isRunning) {
      // eslint-disable-next-line no-await-in-loop
      isRunning = await isProcessRunning('dev');
    }
  }

  await sleep(2500);
}

/**
 * Get a port from an available ports list
 * @returns {number} - the port
 */
function getContainerPort() {
  const port = globalThis.dockerAvailablePorts.pop();

  return port;
}

/**
 * Run a command in a docker container
 * @param {string} command - command to exec
 * @param {string} path - run the command in this path
 * @param {boolean} inBackground - is a command to run in background?
 * @param {string} container - containe to exec
 * @param {string} logPrefix - log prefix to use in vulcan logs
 */
async function execCommandInContainer(
  command,
  path = '/',
  inBackground = false,
  container = 'test',
  logPrefix = 'E2E test',
) {
  const dockerCmd = `docker exec -w ${path} ${container}`;
  const dockerBkgCmd = dockerCmd.replace('-w', '-d -w');

  await exec(
    `${inBackground ? dockerBkgCmd : dockerCmd} ${command}`,
    logPrefix,
  );
}

export { waitForVulcanServer, execCommandInContainer, getContainerPort };
