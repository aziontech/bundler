import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { exec } from 'azion/utils/node';

const execOut = promisify(execCallback);

/**
 * Check if a process is running
 * @param {string} url - url vulcan started
 * @param {string} containerName - container to check
 * @returns {Promise<boolean>} - a promise of a boolean indicating if the process is running
 */
async function isProcessRunning(url, containerName = 'test') {
  try {
    const { stdout } = await execOut(
      `docker exec ${containerName} \
        node -e "const http = require('http'); http.get('${url}', (res) => { console.log(res.statusCode); });" \
        2>&1 | awk "NR==1{print $2}"`,
    );
    const httpCode = parseInt(stdout.trim(), 10);
    return !Number.isNaN(httpCode) && httpCode > 199 && httpCode < 600;
  } catch (err) {
    console.error('Error checking if process is running', err);
    return false;
  }
}

/**
 * Wait for vulcan to start
 * @param {string} url - is a url test container
 * @returns {Promise<string>} return promise resolve
 */
async function waitForVulcanServer(url) {
  const checkInterval = 1000;
  const endTime = Date.now() + 60000; // 30s timeout
  return new Promise((resolve) => {
    // eslint-disable-next-line consistent-return
    const checkProcess = async () => {
      const isRunning = await isProcessRunning(url);
      if (isRunning) {
        return resolve('Running');
      }
      if (Date.now() > endTime) {
        return resolve('Timeout reached');
      }
      // eslint-disable-next-line no-else-return
      setTimeout(checkProcess, checkInterval);
    };
    checkProcess();
  });
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
