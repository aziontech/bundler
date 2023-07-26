import { debug, readWorkerFile, feedback } from '#utils';
import { Messages } from '#constants';
import { runServer } from 'edge-runtime';
import runtime from './runtime.env.js';

/**
 * Read the worker code from the file.
 * @param {string} workerPath - The path to the file containing the code.
 * @returns {Promise<string>} A promise that resolves to the worker code.
 */
async function readWorkerCode(workerPath) {
  try {
    const worker = await readWorkerFile(workerPath);
    return worker;
  } catch (error) {
    debug.error(error);
    feedback.server.error(
      Messages.env.server.errors.load_worker_failed(workerPath),
    );
    throw error;
  }
}

/**
 * Start the HTTP server with the specified port and file path to load the code from.
 * @param {string} workerPath - The path to the file containing the worker code.
 * @param {number} port - The port to listen on.
 */
async function startServer(workerPath, port) {
  try {
    const workerCode = await readWorkerCode(workerPath);
    const execution = runtime(workerCode);
    const server = await runServer({
      port,
      host: 'localhost',
      runtime: execution,
    });
    feedback.server.success(
      Messages.env.server.success.server_running(server.url),
    );
  } catch (error) {
    debug.error(error);
  }
}

export default startServer;
