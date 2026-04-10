import { AzionConfig, processConfig } from '@aziontech/config';

export function processConfigWrapper(config: AzionConfig) {
  return processConfig(config);
}

export default { processConfigWrapper };
