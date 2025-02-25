import { bundler } from '#env';
import { feedback } from 'azion/utils/node';

/**
 * Throw a required attribute error.
 */
function throwError(arg: string) {
  throw new Error(`'${arg}' is required.`);
}

/**
 * @function
 * @description Initializes a new 'temporary store' file.
 */
async function initCommand({
  preset,
  scope,
}: {
  preset: string;
  scope: string;
}) {
  try {
    if (!preset) throwError('preset');
    if (!scope) throwError('scope');

    await bundler.createBundlerEnv({ preset }, scope);

    feedback.info(`Temporary store file created!`);
  } catch (error) {
    feedback.error(
      `Error creating temporary store file: ${(error as Error).message}`,
    );
    process.exit(1);
  }
}

export default initCommand;
