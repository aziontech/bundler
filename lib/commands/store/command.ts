import { writeStore, BundlerStore } from '#env';
import { feedback } from 'azion/utils/node';
import { rm } from 'fs/promises';
import { DOCS_MESSAGE } from '#constants';
import type { StoreCommandParams, StoreCommandConfig } from './types';

export async function storeCommand({ command, options }: StoreCommandParams) {
  const config: StoreCommandConfig = JSON.parse(
    typeof options.config === 'string' ? options.config : '{}',
  );
  const scope = config.scope || 'global';

  try {
    switch (command) {
      case 'init':
        // eslint-disable-next-line no-case-declarations
        const store: BundlerStore = {
          preset: config.preset,
          entry: config.entry,
          bundler: config.bundler,
          polyfills: config.polyfills,
          worker: config.worker,
          functions: config.functions,
        };

        await writeStore(store, scope);
        feedback.info(
          `Store file ${config.preset ? 'created' : 'initialized'} with scope: ${scope}`,
        );
        break;

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
