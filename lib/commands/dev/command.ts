/*
 * @function devCommand
 * @description A command to start the development server.
 * This function takes an options object containing the entry point and port number.
 * @example
 *
 * devCommand({ entry: './path/to/entry.js', port: '3000' });
 */
export async function devCommand({
  entry,
  port,
  skipFrameworkBuild = false,
}: {
  entry?: string;
  port: string;
  skipFrameworkBuild?: boolean;
}) {
  const parsedPort = parseInt(port, 10);
  const { server } = await import('#env');

  const entryPoint = entry || null;

  server(entryPoint, parsedPort, skipFrameworkBuild);
}
