import { join } from 'path';

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
 * @returns {Promise<void>} - A promise that resolves when the development server starts.
 * @example
 *
 * devCommand('./path/to/entry.js', { port: 3000 });
 */
async function devCommand(entry, { port }) {
  const parsedPort = parseInt(port, 10);
  const { server } = await import('#env');
  const entryPoint = entry || join(process.cwd(), '.edge/worker.js');
  server(entryPoint, parsedPort);
}

export default devCommand;
