import { join } from 'path';

/**
 * @function
 * @description A command to start the development server.
 * This function takes a file path and options object as arguments.
 * The file path is the entry point for the development server,
 * and the options object contains the port number.
 * @example
 *
 * devCommand('./path/to/entry.js', { port: 3000 });
 */
async function devCommand(entry: string, { port }: { port: string }) {
  const parsedPort = parseInt(port, 10);
  const { server } = await import('#env');

  const edgeDir = join(process.cwd(), '.edge');
  const devWorkerPath = join(edgeDir, 'worker.dev.js');

  let entryPoint = entry;

  if (!entryPoint) {
    entryPoint = devWorkerPath;
  }

  server(entryPoint, parsedPort);
}

export default devCommand;
