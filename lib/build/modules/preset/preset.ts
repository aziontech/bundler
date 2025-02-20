import type { AzionBuildPreset } from 'azion/config';
import * as presets from 'azion/presets';
/**
 * Validates if preset is valid and has required properties
 */
export const validatePreset = (preset: AzionBuildPreset): boolean => {
  if (!preset?.handler || !preset?.metadata?.name) {
    throw new Error('Preset must have handler and name. ');
  }

  const presetName = preset.metadata.name.toLowerCase();
  const validPresets = Object.keys(presets);

  if (!validPresets.includes(presetName)) {
    throw new Error(`Invalid build preset name: '${presetName}'`);
  }

  return true;
};

/**
 * Loads preset files by name
 */
export const loadPreset = async (
  presetName: string,
): Promise<AzionBuildPreset> => {
  const normalizedName = presetName.toLowerCase();

  const preset = presets[
    normalizedName as keyof typeof presets
  ] as unknown as AzionBuildPreset;

  validatePreset(preset);

  return preset;
};
