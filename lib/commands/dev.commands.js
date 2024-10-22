import { join } from 'path';
import { existsSync } from 'fs';

import { Commands } from '#namespaces';

/**
 * @function
 * @memberof Commands
 * @description A command to start the development server.
 * This function takes a file path and options object as arguments.
 * The file path is the entry point for the development server,
 * and the options object contains the port number.
 * @param {string} entry - The path to the file that serves as the
 *  entry point for the development server.
 * @param {object} options - An object containing configuration options.
 * @param {string|number} options.port - The port number on which the development server will run.
 * @param {boolean} options.firewall - (Experimental) Enable firewall for local environment.
 * @returns {Promise<void>} - A promise that resolves when the development server starts.
 * @example
 *
 * devCommand('./path/to/entry.js', { port: 3000 });
 */
async function devCommand(entry, { firewall, port }) {
  const parsedPort = parseInt(port, 10);
  const { server } = await import('#env');

  const edgeDir = join(process.cwd(), '.edge');
  const devWorkerPath = join(edgeDir, 'worker.dev.js');
  const prodWorkerPath = join(edgeDir, 'worker.js');

  let entryPoint = entry;

  if (!entryPoint) {
    if (!globalThis.vulcan.buildProd && existsSync(devWorkerPath)) {
      entryPoint = devWorkerPath;
    } else if (existsSync(prodWorkerPath)) {
      entryPoint = prodWorkerPath;
    } else {
      entryPoint = join(edgeDir, 'worker.js'); // Fallback
    }
  }

  server(entryPoint, firewall, parsedPort);
}

export default devCommand;
