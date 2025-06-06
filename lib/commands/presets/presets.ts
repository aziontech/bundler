import * as azionPresets from 'azion/presets';

/**
 * @function
 
 * @description Retrieves a list of presets in a beautified format.
 * Unlike `getKeys`, this method returns preset names formatted
 * for display.
 * 
 * @example
 * const presetsList = getBeautify();
 * console.log(presetsList);
 * // Output might be: ['Angular', 'React', 'Vue']
 */
export function getBeautify() {
  const presets = Object.values(azionPresets).map((preset) => preset.metadata.name);
  return presets;
}

/**
 * @function
 
 * @description Retrieves an array of valid preset keys.
 * Each folder name in these directories is considered as a valid preset key.
 * Unlike `getBeautify`, this method returns raw preset names without any formatting or modes.
 * @example
 * const validPresetsKeys = getKeys();
 * console.log(validKeys);
 * // Output might be: ['angular', 'react', 'vue']
 */
export function getKeys() {
  const validPresets = Object.keys(azionPresets);
  return validPresets;
}

/**
 * @function
 * @description Retrieves the configuration for a specific preset.
 * @param presetName - The name of the preset to get config for
 * @returns The AzionConfig for the specified preset
 * @example
 * const config = getPresetConfig('react');
 * console.log(JSON.stringify(config, null, 2));
 */
export function getPresetConfig(presetName: string) {
  const preset = azionPresets[presetName as keyof typeof azionPresets];
  if (!preset) {
    throw new Error(
      `Preset '${presetName}' not found. Run 'ef presets ls' to see available presets.`,
    );
  }
  return preset.config;
}
