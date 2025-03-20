/**
 * @deprecated Legacy module that needs refactoring.
 * This module handles local development server functionality
 * and should be restructured to improve file watching, port management,
 * and server initialization.
 */
import net from 'net';
import { debug } from '#utils';
import { feedback } from 'azion/utils/node';

import chokidar from 'chokidar';
import runtime from './runtime';
import bundler from './bundler';

import { buildCommand } from '../commands/build';
import { runServer } from 'edge-runtime';
import fs from 'fs/promises';

let currentServer: Awaited<ReturnType<typeof runServer>>;
let isChangeHandlerRunning = false;

/**
 * Check and change AddEventListener event
 */
const checkAndChangeAddEventListener = (
  eventTarget: string,
  newEvent: string,
  code: string,
  replaceCode = true,
) => {
  let codeChanged = code;
  const eventRegex = new RegExp(
    `addEventListener\\((['"]?)${eventTarget}\\1,`,
    'g',
  );
  const firewallFunctionRegex = /firewall:\s*\(event\)\s*=>\s*{/g;
  const firewallFunction = !!code.match(firewallFunctionRegex);
  const firewallEventTypeRegex = /eventType\s*=\s*['"]firewall['"];/g;

  const matchEvent = !!code.match(eventRegex);
  if ((replaceCode && matchEvent) || firewallFunction) {
    codeChanged = code.replace(eventRegex, `addEventListener("${newEvent}",`);
    if (firewallFunction) {
      codeChanged = codeChanged.replace(
        firewallEventTypeRegex,
        "eventType = 'fetch';",
      );
    }
  }
  return { matchEvent: matchEvent || firewallFunction, codeChanged };
};

/**
 * Checks if a port is in use by trying to connect to it.
 */
function checkPortAvailability(port: number) {
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
      if ((err as Error).message.includes('ECONNREFUSED')) {
        resolve(false); // Connection refused means the port is not in use
      } else {
        resolve(true); // Assume port is in use if there's an error
      }
    });

    client.connect(port, '127.0.0.1');
  });
}

/**
 * Reads the content of a worker file
 */
async function readWorkerFile(filePath: string): Promise<string> {
  try {
    await fs.access(filePath);
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    const errorMessage = (error as Error).message.includes('ENOENT')
      ? 'File does not exist.'
      : `An error occurred while reading the ${filePath} file.`;
    throw new Error(errorMessage);
  }
}

/**
 * Initialize and run the server with the given port and worker code.
 */
async function initializeServer(port: number, workerCode: string) {
  // Check if the code is a Firewall event and change it to a Fetch event
  // This is required at this point because the VM used for the local runtime
  // server does not support any other type of event than "fetch".
  const { matchEvent: isFirewallEvent, codeChanged } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkAndChangeAddEventListener('firewall', 'fetch', workerCode) as any;
  // Use the changed code if it's a Firewall event
  const initialCode = isFirewallEvent ? codeChanged : workerCode;

  const execution = runtime(initialCode, isFirewallEvent);
  return runServer({ port, host: '0.0.0.0', runtime: execution });
}

/**
 * Build to Local Server with polyfill external
 */
async function buildToLocalServer() {
  const vulcanEnv = await bundler.readStore('global');

  if (!vulcanEnv) {
    const msg = 'Run the build command before running your project.';
    feedback.server.error(msg);
    throw new Error(msg);
  }
  await buildCommand({ production: false });
}

/**
 * Handle server operations: start, restart.
 */
async function manageServer(workerPath: string, port: number) {
  try {
    if (currentServer) {
      await currentServer.close();
    }

    await buildToLocalServer();

    const workerCode = await readWorkerFile(workerPath);

    try {
      currentServer = await initializeServer(port, workerCode);
      feedback.server.success(
        `Function running on port 0.0.0.0:${port}, url: http://localhost:${port}`,
      );
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).message.includes('EADDRINUSE')) {
        await manageServer(workerPath, port + 1);
      } else {
        throw error;
      }
    }
  } catch (error) {
    feedback.server.error(error);
    console.log(error);
    process.exit(1);
  } finally {
    isChangeHandlerRunning = false;
  }
}

/**
 * Handle file changes and prevent concurrent execution.
 */
async function handleFileChange(
  path: string,
  workerPath: string,
  port: number,
) {
  if (isChangeHandlerRunning) return;

  if (
    path.startsWith('.azion-bundler') ||
    (path.startsWith('azion') && path.includes('.temp')) ||
    path.startsWith('.edge') ||
    path.startsWith('node_modules') ||
    path.startsWith('.vercel')
  ) {
    return;
  }

  isChangeHandlerRunning = true;

  try {
    feedback.build.info('Rebuilding with the new changes...');
    await manageServer(workerPath, port);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (debug as any).error(`Build or server restart failed: ${error}`);
  } finally {
    isChangeHandlerRunning = false;
  }
}

/**
 * Entry point function to start the server and watch for file changes.
 */
async function startServer(workerPath: string, port: number) {
  const IsPortInUse = await checkPortAvailability(port);
  if (IsPortInUse) {
    feedback.server.error(
      `Port ${port} is in use. Please choose another port.`,
    );
    process.exit(1);
  }
  await manageServer(workerPath, port);

  const watcher = chokidar.watch('./', {
    persistent: true,
    ignoreInitial: true, // Ignore the initial add events
    depth: 99,
    ignored: ['.git', '.vscode', '.idea', '.sublime-text', '.history'], // Added common IDE-related folders
  });

  const handleUserFileChange = async (path: string) => {
    await handleFileChange(path, workerPath, port);
  };

  watcher
    .on('add', handleUserFileChange)
    .on('change', handleUserFileChange)
    .on('unlink', handleUserFileChange)
    .on('addDir', handleUserFileChange)
    .on('unlinkDir', handleUserFileChange)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('error', (error) => (debug as any).error(`Watcher error: ${error}`))
    .on('ready', () =>
      feedback.server.info('Initial scan complete. Ready for changes.'),
    );
}

export default startServer;
