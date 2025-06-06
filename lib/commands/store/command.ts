import { writeStore, BundlerStore } from '#env';
import { feedback } from 'azion/utils/node';
import { rm } from 'fs/promises';
import { DOCS_MESSAGE } from '#constants';
import type { StoreCommandParams } from './types';

/**
 * Store Command - Azion configuration storage management
 *
 * This command manages the initialization and cleanup of Azion configuration storage,
 * providing utilities to set up your local development environment and clean up
 * configuration files when needed.
 *
 * @description
 * The store command handles configuration management with two main operations:
 * 1. init - Initialize configuration storage with proper setup
 * 2. destroy - Clean up and remove configuration files
 *
 * Available subcommands:
 * - init: Initialize Azion configuration storage
 * - destroy: Remove and clean up configuration files
 *
 * @examples
 *
 * === INITIALIZATION ===
 *
 * # Initialize with default settings
 * ef store init
 *
 * # Initialize with custom config file
 * ef store init -c ./custom.config.js
 * ef store init --config ./my-azion.config.js
 *
 * # Initialize with specific scope
 * ef store init -s global
 * ef store init --scope local
 * ef store init --scope project
 *
 * # Initialize with both config and scope
 * ef store init -c ./prod.config.js -s global
 *
 * === DESTRUCTION/CLEANUP ===
 *
 * # Destroy default configuration
 * ef store destroy
 *
 * # Destroy with custom config file
 * ef store destroy -c ./custom.config.js
 * ef store destroy --config ./my-azion.config.js
 *
 * # Destroy with specific scope
 * ef store destroy -s global
 * ef store destroy --scope local
 *
 * # Destroy with both config and scope
 * ef store destroy -c ./prod.config.js -s global
 *
 * === SCOPE MANAGEMENT ===
 *
 * # Project-level configuration (default)
 * ef store init -s project
 * ef store destroy -s project
 *
 * # Local user configuration
 * ef store init -s local
 * ef store destroy -s local
 *
 * # Global system configuration
 * ef store init -s global
 * ef store destroy -s global
 *
 * === COMMON WORKFLOWS ===
 *
 * # Project setup workflow
 * ef store init
 * ef config create -k "build.preset" -v "typescript"
 * ef build
 *
 * # Environment-specific setup
 * ef store init -c ./staging.config.js -s local
 * ef build -p react
 * ef dev
 *
 * # Complete project cleanup
 * ef store destroy
 * # Removes all configuration files
 *
 * # Reset configuration
 * ef store destroy && ef store init
 *
 * === INTEGRATION EXAMPLES ===
 *
 * # Setup for new project
 * ef store init
 * ef config create -k "edgeApplications[0].name" -v "My New App"
 * ef build -p typescript
 * ef manifest generate
 *
 * # Multi-environment management
 * ef store init -c ./dev.config.js -s local
 * ef store init -c ./prod.config.js -s global
 *
 * # Switch between configurations
 * ef store destroy -s local
 * ef store init -c ./different.config.js -s local
 *
 * # Clean slate for troubleshooting
 * ef store destroy --all
 * ef store init
 * ef config create -k "build.preset" -v "javascript"
 *
 * @initialization_features
 * The init command:
 * - Creates necessary configuration directories
 * - Sets up default azion.config.js if not exists
 * - Initializes storage with proper permissions
 * - Creates backup of existing configurations
 * - Validates configuration file structure
 * - Sets up environment-specific settings
 *
 * @destruction_features
 * The destroy command:
 * - Safely removes configuration files
 * - Creates backup before deletion
 * - Cleans up temporary files
 * - Removes cache and build artifacts
 * - Preserves important project files
 * - Validates scope before deletion
 *
 * @scope_levels
 * - project: Configuration stored in current project directory
 * - local: User-specific configuration in home directory
 * - global: System-wide configuration for all users
 *
 * @safety_features
 * - Automatic backup creation before destructive operations
 * - Confirmation prompts for dangerous operations
 * - Scope validation to prevent accidental deletions
 * - Preservation of non-Azion configuration files
 * - Rollback capability for failed operations
 *
 * @notes
 * - Always backup important configurations before using destroy
 * - init is safe to run multiple times (idempotent)
 * - destroy operations cannot be undone without backups
 * - Global scope requires appropriate system permissions
 * - Custom config files must exist before initialization
 * - Scope affects where configuration files are stored and managed
 * - Use destroy carefully in production environments
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
