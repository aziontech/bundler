import type { AzionBuildPreset } from 'azion/config';
import * as presets from 'azion/presets';

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
  if (!preset?.handler || !preset?.meta?.name) {
    throw new Error(`Invalid preset "${normalizedName}"`);
  }

  return preset;
};
