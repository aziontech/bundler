import { createStore } from '#env';
import { feedback } from 'azion/utils/node';

/**
 * @function
 * @description Creates a temporary JSON file in system's temp directory to store program state
 */
export async function initCommand({
  preset,
  scope,
}: {
  preset: string;
  scope: string;
}) {
  try {
    if (!preset) throw new Error('Preset is required.');
    if (!scope) throw new Error('Scope is required.');

    await createStore({ preset }, scope);
    feedback.info(`Temporary store file created!`);
  } catch (error) {
    feedback.error(
      `Error creating temporary store file: ${(error as Error).message}`,
    );
    process.exit(1);
  }
}
