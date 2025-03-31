import { join } from 'path';
import { DIRECTORIES, BUNDLER } from '#constants';

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

  const devWorkerPath = join(
    DIRECTORIES.OUTPUT_FUNCTIONS_PATH,
    BUNDLER.DEFAULT_DEV_WORKER_FILENAME,
  );

  const entryPoint = entry || devWorkerPath;

  server(entryPoint, parsedPort);
}
