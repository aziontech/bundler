import { writeStore, BundlerStore } from '#env';
import { feedback } from 'azion/utils/node';
import { rm } from 'fs/promises';

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

export async function storeCommand({
  command,
  options = {},
}: StoreCommandParams) {
  const scope = options.scope || 'global';

  try {
    switch (command) {
      case 'init':
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
    feedback.error(`Store command failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
