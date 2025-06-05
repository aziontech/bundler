import { readAzionConfig, writeUserConfig } from '#env';
import { createConfig, updateConfig, readConfig, deleteConfig } from './config';
import type { ConfigCommandOptions } from './types';
import type { AzionConfig } from 'azion/config';

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
