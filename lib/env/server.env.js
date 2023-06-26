import http from 'http';
import chokidar from 'chokidar';

import { debug, feedback, readWorkerFile } from '#utils';
import { Messages } from '#constants';
import run from './runtime.env.js';

/**
 * Create a new HTTP server.
 * @param {string} filePath - The path to the file containing the code.
 * @returns {http.Server} The created server.
 */
function createServer(filePath) {
  return http.createServer(async (request, response) => {
    let code;

    try {
      // Load the code to be executed on the server for each request
      code = await readWorkerFile(filePath);
    } catch (error) {
      debug.error(error);
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain');
      response.end(JSON.stringify({ error: error.message }));
      return;
    }

    try {
      const responseBody = await run(code, { request, response });

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
      feedback.error(Messages.env.server.errors.load_worker_failed);
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain');
      response.end(JSON.stringify({ error: { message: errorMessage, status: 500 } }));
    }
  });
}

/**
 * Start the HTTP server with the specified port and file path to load the code from.
 * @param {string} filePath - The path to the file containing the code.
 * @param {number} port - The port to listen on.
 * @returns {http.Server} The created server.
 */
async function startServer(filePath, port) {
  let server = createServer(filePath);

  // Use chokidar to watch for changes in the file
  const watcher = chokidar.watch(filePath);

  watcher.on('change', async () => {
    feedback.info(Messages.env.server.info.code_change_detect);
    // Close the current server
    server.close();
    // And create a new one
    server = createServer(filePath);
    server.listen(port, () => {
      feedback.success(Messages.env.server.success.server_running(port));
    });
  });

  server.listen(port, () => {
    feedback.success(Messages.env.server.success.server_running(port));
  });

  return server;
}

export default startServer;
