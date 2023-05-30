import { NodeVM } from 'vm2';
import fs from 'fs/promises';
import http from 'http';
import chokidar from 'chokidar';

/**
 * Load code from the specified file.
 * @param {string} filePath - The path to the file containing the code.
 * @returns {Promise<string>} A Promise that resolves with the loaded code.
 */
async function loadCodeFromFile(filePath) {
  const fileExists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

  if (!fileExists) {
    throw new Error('Unable to locate the entrypoint of your application.');
  }

  const code = await fs.readFile(filePath, 'utf8');
  return code;
}

/**
 * Execute the specified code with the provided event object.
 * @param {string} code - The JavaScript code to be executed.
 * @param {object} event - The event object containing the request and other properties.
 * @returns {Promise<object>} A Promise that resolves with the Response object.
 */
async function executeCode(code, event) {
  let fetchEventHandler = null;
  let respondWithPromise = null;

  const vm = new NodeVM({
    console: 'inherit',
    sandbox: {
      ...event,
      Response,
      addEventListener: (type, handler) => {
        if (type !== 'fetch') {
          throw new Error(`Unsupported event type: ${type}`);
        }
        fetchEventHandler = handler;
      },
    },
    require: {
      external: true,
      builtin: ['fs', 'url', 'path'],
    },
  });

  try {
    vm.run(code);
  } catch (error) {
    console.error('An error occurred while executing the script:', error);
    throw error;
  }

  if (!fetchEventHandler) {
    throw new Error('No fetch event handler was defined');
  }

  let response;
  try {
    const fetchEvent = {
      request: event.request,
      respondWith: (responsePromise) => {
        respondWithPromise = responsePromise;
      },
    };
    fetchEventHandler(fetchEvent);
    response = respondWithPromise;
  } catch (error) {
    console.error('An error occurred while handling the fetch event:', error);
    throw error;
  }

  if (!response) {
    throw new Error('No response was defined');
  }

  return response;
}

/**
 * Start the HTTP server with the specified code and port.
 * @param {string} code - The JavaScript code to be executed.
 * @param {number} port - The port to listen on.
 * @returns {http.Server} The created server.
 */
function startServer(code, port) {
  const server = http.createServer(async (request, response) => {
    try {
      const responseBody = await executeCode(code, { request, response });

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
      console.error('An error occurred while executing the script:', error);
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain');
      response.end('Internal Server Error');
    }
  });

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  return server;
}

/**
 * Run the server and load the code from the specified file.
 * @param {string} filePath - The path to the file containing the code.
 * @param {number} port - The port to listen on.
 * @returns {void}
 */
function execute(filePath, port) {
  let server = null;
  let code = null;

  const loadAndRunCode = async () => {
    try {
      const newCode = await loadCodeFromFile(filePath);
      console.log('Code loaded successfully');
      code = newCode;

      if (server) {
        server.close(() => {
          server = startServer(code, port);
        });
      } else {
        server = startServer(code, port);
      }
    } catch (error) {
      console.error('Failed to load code:', error);
    }
  };

  const watcher = chokidar.watch(filePath);
  watcher.on('change', loadAndRunCode);
  loadAndRunCode();
}

export default execute;
