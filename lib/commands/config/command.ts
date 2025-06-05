import { readAzionConfig, writeUserConfig } from '#env';
import { createConfig, updateConfig, readConfig, deleteConfig } from './config';
import type { ConfigCommandOptions } from './types';
import type { AzionConfig } from 'azion/config';

/**
 * Config Command - Complete CRUD operations for Azion configuration management
 *
 * This command provides comprehensive management of azion.config.js settings through
 * Create, Read, Update, Delete operations with support for nested properties and arrays.
 *
 * @description
 * The config command allows you to manipulate your Azion configuration file without
 * manually editing JSON/JS files. It supports complex nested structures, arrays,
 * and provides validation to ensure configuration integrity.
 *
 * @examples
 *
 * === CREATING CONFIGURATIONS ===
 *
 * # Create basic build configuration
 * ef config create -k "build.preset" -v "typescript"
 * ef config create --key "build.bundler" --value "esbuild"
 *
 * # Create complete build object
 * ef config create -k "build" -v '{"preset": "react", "bundler": "esbuild", "polyfills": true}'
 *
 * # Create edge application
 * ef config create -k "edgeApplications[0]" -v '{"name": "My App", "edgeCacheEnabled": true}'
 *
 * # Create edge application with rules
 * ef config create -k "edgeApplications[0].rules.request[0]" -v '{"name": "Static Assets", "behavior": {"deliver": true}}'
 *
 * # Create edge function
 * ef config create -k "edgeFunctions[0]" -v '{"name": "auth", "path": "./functions/auth.js"}'
 *
 * # Create storage configuration
 * ef config create -k "edgeStorage[0]" -v '{"name": "assets", "dir": "./public", "edgeAccess": "read_only"}'
 *
 * === READING CONFIGURATIONS ===
 *
 * # Read entire configuration
 * ef config read --all
 * ef config read -a
 *
 * # Read specific properties
 * ef config read -k "build.preset"
 * ef config read --key "edgeApplications[0].name"
 *
 * # Read nested objects
 * ef config read -k "build"
 * ef config read -k "edgeApplications[0].rules"
 *
 * # Read array elements
 * ef config read -k "edgeFunctions[0]"
 * ef config read -k "edgeApplications[0].rules.request[1]"
 *
 * === UPDATING CONFIGURATIONS ===
 *
 * # Update build settings
 * ef config update -k "build.preset" -v "vue"
 * ef config update -k "build.polyfills" -v "false"
 *
 * # Update edge application properties
 * ef config update -k "edgeApplications[0].name" -v "Updated App Name"
 * ef config update -k "edgeApplications[0].edgeCacheEnabled" -v "false"
 *
 * # Update complex nested structures
 * ef config update -k "edgeApplications[0].rules.request[0].behavior" -v '{"bypassCache": true, "deliver": true}'
 *
 * # Update array elements
 * ef config update -k "edgeFunctions[0].path" -v "./functions/updated-auth.js"
 * ef config update -k "edgeStorage[0].edgeAccess" -v "read_write"
 *
 * === DELETING CONFIGURATIONS ===
 *
 * # Delete entire configuration
 * ef config delete --all
 * ef config delete -a
 *
 * # Delete specific properties
 * ef config delete -k "build.polyfills"
 * ef config delete -k "edgeApplications[0].debug"
 *
 * # Delete array elements (removes and shifts)
 * ef config delete -k "edgeFunctions[0]"
 * ef config delete -k "edgeApplications[0].rules.request[1]"
 *
 * # Delete entire sections
 * ef config delete -k "build"
 * ef config delete -k "edgeApplications[0].rules"
 *
 * === ADVANCED EXAMPLES ===
 *
 * # Create complete edge application with cache and rules
 * ef config create -k "edgeApplications[0]" -v '{
 *   "name": "Production App",
 *   "edgeCacheEnabled": true,
 *   "edgeFunctionsEnabled": true,
 *   "cache": [
 *     {
 *       "name": "default",
 *       "browser": {"maxAgeSeconds": 86400},
 *       "edge": {"maxAgeSeconds": 604800}
 *     }
 *   ],
 *   "rules": {
 *     "request": [
 *       {
 *         "name": "API Routes",
 *         "match": "^/api/.*",
 *         "behavior": {"bypassCache": true}
 *       }
 *     ]
 *   }
 * }'
 *
 * # Create firewall configuration
 * ef config create -k "edgeFirewall[0]" -v '{
 *   "name": "Security Rules",
 *   "domains": ["example.com"],
 *   "active": true,
 *   "waf": true
 * }'
 *
 * # Update complex build configuration
 * ef config update -k "build" -v '{
 *   "entry": "./src/main.ts",
 *   "preset": "typescript",
 *   "bundler": "esbuild",
 *   "polyfills": true,
 *   "worker": false
 * }'
 *
 * @notes
 * - All write operations (create, update, delete) automatically save to azion.config.js
 * - Read operations return JSON data without modifying files
 * - Arrays are zero-indexed: [0], [1], [2], etc.
 * - Nested properties use dot notation: "object.property.subproperty"
 * - Values must be valid JSON for complex objects
 * - Use --all flag carefully as it affects the entire configuration
 */

export async function configCommand({ command, options }: ConfigCommandOptions) {
  const userConfig: AzionConfig = (await readAzionConfig()) || {};

  if (options.all) {
    switch (command) {
      case 'read':
        return userConfig;
      case 'delete':
        await writeUserConfig({});
        return {};
      default:
        throw new Error('--all flag is only supported for read and delete commands');
    }
  }

  if (!options.key) {
    throw new Error('Key is required when --all is not used');
  }

  let result: AzionConfig;

  switch (command) {
    case 'create':
      if (userConfig) {
        throw new Error('Configuration already exists. Use update command instead.');
      }
      if (!options.value) {
        throw new Error('Value is required for create command');
      }
      result = createConfig({
        key: options.key,
        value: options.value,
      });
      break;
    case 'update':
      if (!userConfig) {
        throw new Error('No configuration found. Use create command first.');
      }
      if (!options.value) {
        throw new Error('Value is required for update command');
      }
      result = updateConfig({
        key: options.key,
        value: options.value,
        config: userConfig,
      });
      break;
    case 'read':
      if (!userConfig) {
        throw new Error('No configuration found');
      }
      return readConfig({
        key: options.key,
        config: userConfig,
      });
    case 'delete':
      if (!userConfig) {
        throw new Error('No configuration found');
      }
      result = deleteConfig({
        key: options.key,
        config: userConfig,
      });
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }

  await writeUserConfig(result);
  return result;
}
