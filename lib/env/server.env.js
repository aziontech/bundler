import http from 'http';
import chokidar from 'chokidar';
import { join } from 'path';
import {
  debug, feedback, readWorkerFile, exec,
} from '#utils';
import { Messages } from '#constants';
import run from './runtime.env.js';

let server = null;
let workerCode = null;

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
    throw error;
  }
}

/**
 * Create or update the HTTP server with the new code.
 * @param {string} newCode - The new worker code.
 * @returns {http.Server} The updated server.
 */
function createOrUpdateServer(newCode) {
  if (server) {
    server.close();
  }

  server = http.createServer(async (request, response) => {
    try {
      const baseUrl = request.headers.host;
      const url = new URL(request.url, `http://${baseUrl}`);
      const fullPath = join(url.origin, url.pathname);
      request.url = fullPath;

      const responseBody = await run(newCode, { request, response });

      if (responseBody instanceof Response) {
        responseBody.headers.forEach((value, name) => {
          response.setHeader(name, value);
        });

        const body = await responseBody.text();
        response.statusCode = responseBody.status;
        response.end(body);
      } else {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/plain');
        response.end(responseBody);
      }
    } catch (error) {
      let errorMessage = error.message;
      if (error.message.includes('is not defined')) {
        errorMessage = `${error.message} in Edge runtime.`;
      }

      error.message = errorMessage;
      debug.error(error);
      feedback.server.error((errorMessage));
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain');
      response.end(JSON.stringify({ error: { message: errorMessage, status: 500 } }));
    }
  });

  return server;
}

/**
 * Start the HTTP server with the specified port and file path to load the code from.
 * @param {string} workerPath - The path to the file containing the worker code.
 * @param {number} port - The port to listen on.
 * @returns {http.Server} The created or updated server.
 */
async function startServer(workerPath, port) {
  try {
    workerCode = await readWorkerCode(workerPath);
  } catch (error) {
    debug.error(error);
    feedback.server.error(Messages.env.server.errors.load_worker_failed(workerPath));
    return null;
  }

  server = createOrUpdateServer(workerCode);

  // Use chokidar to watch for changes in the file
  const watcher = chokidar.watch(workerPath);

  watcher.on('change', async () => {
    feedback.server.info(Messages.env.server.info.code_change_detect);
    try {
      workerCode = await readWorkerCode(workerPath);
      server = createOrUpdateServer(workerCode);
      server.listen(port, () => {});
    } catch (error) {
      debug.error(error);
      feedback.server.error(Messages.env.server.errors.load_worker_failed(workerPath));
    }
  });

  server.listen(port, () => {
    const isWindows = process.platform === 'win32';
    exec(`${isWindows ? 'start ' : 'open '} http://localhost:${port} `);
    feedback.server.success(Messages.env.server.success.server_running(port));
  });

  return server;
}

export default startServer;
