import { feedback } from '@aziontech/utils/node';
import { server } from '../../env';
import { resolveConfigFile } from '../../env/config-file';
import { DOCS_MESSAGE } from '../../constants';

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
  functionName,
  configVersion,
  configFile,
}: {
  entry?: string;
  port: string;
  skipFrameworkBuild?: boolean;
  functionName?: string;
  configVersion?: string | number;
  configFile?: string;
}) {
  const parsedPort = parseInt(port, 10);

  const entryPoint = entry || null;

  let resolvedConfigFile: string | undefined;
  try {
    resolvedConfigFile = resolveConfigFile(configFile);
  } catch (error) {
    feedback.server.error(
      `${error instanceof Error ? error.message : String(error)}${DOCS_MESSAGE}`,
    );
    process.exit(1);
  }

  server(
    entryPoint,
    parsedPort,
    skipFrameworkBuild,
    functionName,
    configVersion,
    resolvedConfigFile,
  );
}
