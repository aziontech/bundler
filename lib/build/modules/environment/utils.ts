import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import lodash from 'lodash';
import { AzionConfig } from 'azion/config';

/**
 * Checks if the project is using CommonJS based on package.json
 * If there's no package.json or no 'type' field, assumes CommonJS
 */
export const isCommonJS = (): boolean => {
  const packageJsonPath = join(process.cwd(), 'package.json');

  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.type !== 'module';
  }

  return true;
};

/**
 * Merges base config with user config, prioritizing user settings
 * while preserving build configuration from base
 */
export const mergeConfigWithUserOverrides = (
  baseConfig: AzionConfig,
  userConfig: AzionConfig | null,
): AzionConfig => {
  const customizer = (objValue: any, srcValue: any) => {
    if (objValue && !objValue.build) {
      return srcValue;
    }
    return undefined;
  };

  return lodash.mergeWith({}, baseConfig, userConfig, customizer);
};
