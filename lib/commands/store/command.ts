import { writeStore, BundlerStore, readStore } from '#env';
import { feedback } from 'azion/utils/node';
import { rm } from 'fs/promises';
import { DOCS_MESSAGE } from '#constants';
import type { StoreCommandParams } from './types';
import { updateConfigByNames } from './update';

export async function storeCommand({ command, options }: StoreCommandParams) {
  const config: BundlerStore = JSON.parse(
    typeof options.config === 'string' ? options.config : '{}',
  );
  const scope = options.scope || 'global';

  try {
    switch (command) {
      case 'init': {
        const store: BundlerStore = { ...config };

        await writeStore(store, scope);
        feedback.info(
          `Store file ${config.build?.preset ? 'created' : 'initialized'} with scope: ${scope}`,
        );
        break;
      }

      case 'update': {
        const currentConfig = await readStore(scope);
        const updatedConfig = updateConfigByNames(currentConfig, config);
        await writeStore(updatedConfig, scope);
        feedback.info(`Store file updated with scope: ${scope}`);
        break;
      }

      case 'destroy':
        await rm(globalThis.bundler.tempPath, { recursive: true, force: true });
        feedback.info('Temporary store directory removed');
        break;

      default:
        throw new Error(`Invalid command: ${command}`);
    }
  } catch (error) {
    feedback.error(`${error instanceof Error ? error.message : String(error)}${DOCS_MESSAGE}`);
    process.exit(1);
  }
}
