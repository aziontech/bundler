import type { AzionBuildPreset } from 'azion/config';
import * as presets from 'azion/presets';
import { feedback } from '#utils';
import { Messages } from '#constants';

/**
 * Validates if preset is valid and has required properties
 */
export const validatePreset = (preset: AzionBuildPreset): boolean => {
  if (!preset?.handler || !preset?.meta?.name) {
    throw new Error('Preset must have handler and meta.name');
  }

  const presetName = preset.meta.name.toLowerCase();
  const validPresets = Object.keys(presets);

  if (!validPresets.includes(presetName)) {
    feedback.build.error(Messages.build.error.invalid_preset(presetName));
    process.exit(1);
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
  const validPresets = Object.keys(presets);

  if (!validPresets.includes(normalizedName)) {
    throw new Error(
      `Invalid preset "${presetName}". Valid presets are: ${validPresets.join(', ')}`,
    );
  }

  const preset = presets[
    normalizedName as keyof typeof presets
  ] as unknown as AzionBuildPreset;

  validatePreset(preset);

  return preset;
};
