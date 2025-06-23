import { writeStore, BundlerStore } from '#env';
import { feedback } from 'azion/utils/node';
import { rm } from 'fs/promises';
import { DOCS_MESSAGE } from '#constants';
import type { StoreCommandParams } from './types';

/**
 * Store Command - Azion Bundler State Management
 *
 * Manages persistent state storage for the Azion bundler, allowing configuration
 * and runtime data to be saved and retrieved across different bundler executions.
 *
 * @description
 * The store command handles persistent state management with two main operations:
 *
 * **State Persistence:**
 * - **Global Scope**: Saves state to a temporary system directory (globalThis.bundler.tempPath)
 * - **Local Scope**: Saves state to the current project directory
 * - State is stored as JSON in `.azion-bundler.json` files
 *
 * **Use Cases:**
 * - Preserve build configurations between sessions
 * - Cache bundler settings and optimizations
 * - Share state between different bundler processes
 * - Maintain environment variables and build context
 *
 * **Available Operations:**
 * - `init`: Initializes and persists bundler state to storage
 * - `destroy`: Removes all stored state and temporary files
 *
 * @example
 * ```bash
 * # Save current config to global state
 * azion store init --scope global --config '{"buildMode": "production"}'
 *
 * # Clean up all stored state
 * azion store destroy
 * ```
 */
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
        feedback.info(`Store file initialized with scope: ${scope}`);
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
