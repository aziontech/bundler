import net from 'net';
import { debug, readWorkerFile, feedback, helperHandlerCode } from '#utils';
import { Messages } from '#constants';
import { runServer, EdgeRuntime } from 'edge-runtime';
import chokidar from 'chokidar';
import runtime from './runtime.env.js';
import vulcan from './vulcan.env.js';
import buildCommand from '../commands/build.commands.js';

let currentServer;
let isChangeHandlerRunning = false;

/**
 * Checks if a port is in use by trying to connect to it.
 * @param {number} port - The port number to check.
 * @returns {Promise<boolean>} - True if the port is in use, false otherwise.
 */
function checkPortAvailability(port) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(1000); // Timeout for the connection attempt

    client.on('connect', () => {
      client.destroy(); // Destroy the socket after successful connection
      resolve(true); // Port is in use
    });

    client.on('timeout', () => {
      client.destroy();
      resolve(false); // Timeout likely means the port is not in use
    });

    client.on('error', (err) => {
      client.destroy();
      if (err.code === 'ECONNREFUSED') {
        resolve(false); // Connection refused means the port is not in use
      } else {
        resolve(true); // Assume port is in use if there's an error
      }
    });

    client.connect(port, '127.0.0.1');
  });
}

/**
 * Read the worker code from a specified path.
 * @param {string} workerPath - Path to the worker file.
 * @returns {Promise<string>} - The worker code.
 * @throws {Error} - If unable to read the worker file.
 */
async function readWorkerCode(workerPath) {
  try {
    return await readWorkerFile(workerPath);
  } catch (error) {
    debug.error(error);
    feedback.server.error(
      Messages.env.server.errors.load_worker_failed(workerPath),
    );
    throw error;
  }
}

/**
 * Initialize and run the server with the given port and worker code.
 * @param {number} port - The port number.
 * @param {string} workerCode - The worker code.
 * @returns {Promise<EdgeRuntime>} - The initialized server.
 */
async function initializeServer(port, workerCode) {
  // Check if the code is a Firewall event and change it to a Fetch event
  // This is required at this point because the VM used for the local runtime
  // server does not support any other type of event than "fetch".
  const { matchEvent: isFirewallEvent, codeChanged } =
    helperHandlerCode.checkAndChangeAddEventListener(
      'firewall',
      'fetch',
      workerCode,
    );
  // Use the changed code if it's a Firewall event
  const initialCode = isFirewallEvent ? codeChanged : workerCode;

  const execution = runtime(initialCode, isFirewallEvent);
  return runServer({ port, host: '0.0.0.0', runtime: execution });
}

/**
 * Build to Local Server with polyfill external
 * @param {boolean} isFirewall - (Experimental) Enable isFirewall for local environment.
 */
async function buildToLocalServer(isFirewall) {
  const vulcanEnv = await vulcan.readVulcanEnv('global');

  if (!vulcanEnv) {
    const msg = Messages.env.server.errors.run_build_command;
    feedback.server.error(msg);
    throw new Error(msg);
  }
  globalThis.vulcan.buildProd = false;
  await buildCommand({}, isFirewall);
}

/**
 * Handle server operations: start, restart.
 * @param {string} workerPath - Path to the worker file.
 * @param {number} port - The port number.
 * @param {boolean} isFirewall - (Experimental) Enable isFirewall for local environment.
 */
async function manageServer(workerPath, port, isFirewall) {
  try {
    if (currentServer) {
      await currentServer.close();
    }

    await buildToLocalServer(isFirewall);

    const workerCode = await readWorkerCode(workerPath);

    try {
      currentServer = await initializeServer(port, workerCode);
      feedback.server.success(
        Messages.env.server.success.server_running(
          `0.0.0.0:${port}, url: http://localhost:${port}`,
        ),
      );
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        await manageServer(workerPath, port + 1, isFirewall);
      } else {
        throw error;
      }
    }
  } catch (error) {
    debug.error(error);
    process.exit(1);
  } finally {
    isChangeHandlerRunning = false;
  }
}

/**
 * Handle file changes and prevent concurrent execution.
 * @param {string} path - Path of the changed file.
 * @param {string} workerPath - Path to the worker file.
 * @param {number} port - The port number.
 * @param {boolean} isFirewall - (Experimental) Enable isFirewall for local environment.
 */
async function handleFileChange(path, workerPath, port, isFirewall) {
  if (isChangeHandlerRunning) return;

  if (
    path.startsWith('.vulcan') ||
    (path.startsWith('vulcan') && path.includes('.temp')) ||
    path.startsWith('.edge') ||
    path.startsWith('node_modules/.cache') ||
    path.startsWith('.vercel')
  ) {
    return;
  }

  isChangeHandlerRunning = true;

  try {
    feedback.build.info(Messages.build.info.rebuilding);
    await manageServer(workerPath, port, isFirewall);
  } catch (error) {
    debug.error(`Build or server restart failed: ${error}`);
  } finally {
    isChangeHandlerRunning = false;
  }
}

/**
 * Entry point function to start the server and watch for file changes.
 * @param {string} workerPath - Path to the worker file.
 * @param {boolean} isFirewall - (Experimental) Enable isFirewall for local environment.
 * @param {number} port - The port number.
 */
async function startServer(workerPath, isFirewall, port) {
  const IsPortInUse = await checkPortAvailability(port);
  if (IsPortInUse) {
    feedback.server.error(
      `Port ${port} is in use. Please choose another port.`,
    );
    process.exit(1);
  }
  await manageServer(workerPath, port, isFirewall); // Initialize the server for the first time

  const watcher = chokidar.watch('./', {
    persistent: true,
    ignoreInitial: true, // Ignore the initial add events
    depth: 99,
    ignored: ['.git', '.vscode', '.idea', '.sublime-text', '.history'], // Added common IDE-related folders
  });

  const handleUserFileChange = async (path) => {
    await handleFileChange(path, workerPath, port, isFirewall);
  };

  watcher
    .on('add', handleUserFileChange)
    .on('change', handleUserFileChange)
    .on('unlink', handleUserFileChange)
    .on('addDir', handleUserFileChange)
    .on('unlinkDir', handleUserFileChange)
    .on('error', (error) => debug.error(`Watcher error: ${error}`))
    .on('ready', () =>
      feedback.server.info('Initial scan complete. Ready for changes.'),
    );
}

export default startServer;
