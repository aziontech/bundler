import { writeStore, BundlerStore } from '#env';
import { feedback } from 'azion/utils/node';
import { rm } from 'fs/promises';
import { DOCS_MESSAGE } from '#constants';
type StoreCommandAction = 'init' | 'destroy';

interface StoreCommandOptions {
  preset?: string;
  entry?: string;
  bundler?: 'webpack' | 'esbuild';
  polyfills?: boolean;
  worker?: boolean;
  scope?: string;
}

interface StoreCommandParams {
  command: StoreCommandAction;
  options?: StoreCommandOptions;
}

export async function storeCommand({ command, options = {} }: StoreCommandParams) {
  const scope = options.scope || 'global';

  try {
    switch (command) {
      case 'init':
        // eslint-disable-next-line no-case-declarations
        const store: BundlerStore = {
          preset: options.preset,
          entry: options.entry,
          bundler: options.bundler,
          polyfills: options.polyfills,
          worker: options.worker,
        };

        await writeStore(store, scope);
        feedback.info(
          `Store file ${options.preset ? 'created' : 'initialized'} with scope: ${scope}`,
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
