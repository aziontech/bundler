import lodash from 'lodash';
import { AzionConfig } from 'azion/config';

/**
 * Merges base config with user config, prioritizing user settings
 * while preserving build configuration from base
 */
export const mergeConfigWithUserOverrides = (
  baseConfig: AzionConfig,
  userConfig: AzionConfig | null,
): AzionConfig => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customizer = (objValue: any, srcValue: any) => {
    if (objValue && !objValue.build) {
      return srcValue;
    }
    return undefined;
  };

  return lodash.mergeWith({}, baseConfig, userConfig, customizer);
};

export default { mergeConfigWithUserOverrides };
