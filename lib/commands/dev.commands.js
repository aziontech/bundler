import { join } from 'path';
/**
 *
 * @param file
 * @param options
 * @param options.port
 */
async function devCommand(file, { port }) {
  const parsedPort = parseInt(port, 10);
  const { server } = await import('#env');
  const entryPoint = file || join(process.cwd(), '.edge/worker.js');
  server(entryPoint, parsedPort);
}

export default devCommand;
