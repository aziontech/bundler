import { AzionConfig, processConfig } from 'azion/config';

export function processConfigWrapper(config: AzionConfig) {
  return processConfig(config);
}

export default { processConfigWrapper };
