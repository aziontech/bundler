import { join } from 'path';

/**
 * @function
 * @description A command to start the development server.
 * This function takes an options object containing the entry point and port number.
 * @example
 *
 * devCommand({ entry: './path/to/entry.js', port: '3000' });
 */
export async function devCommand({
  entry,
  port,
}: {
  entry?: string;
  port: string;
}) {
  const parsedPort = parseInt(port, 10);
  const { server } = await import('#env');

  const edgeDir = join(process.cwd(), '.edge');
  const devWorkerPath = join(edgeDir, 'worker.dev.js');

  const entryPoint = entry || devWorkerPath;

  server(entryPoint, parsedPort);
}
