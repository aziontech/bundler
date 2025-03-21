import type { AzionBuildPreset, PresetInput } from 'azion/config';
import * as presets from 'azion/presets';
import * as utilsNode from 'azion/utils/node';
import inferPreset from './infer/infer-preset';

/**
 * Validates if preset is valid and has required properties
 */
const validatePreset = (preset: AzionBuildPreset): boolean => {
  if (!preset.metadata?.name || !preset.config) {
    throw new Error('Preset must have name and config.');
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
const loadPreset = async (presetName: string): Promise<AzionBuildPreset> => {
  const normalizedName = presetName.toLowerCase();
  return presets[
    normalizedName as keyof typeof presets
  ] as unknown as AzionBuildPreset;
};

/**
 * Loads and validates preset from input
 */
export const resolvePreset = async (
  input?: PresetInput,
): Promise<AzionBuildPreset> => {
  if (!input) {
    utilsNode.feedback.build.info(
      'No preset specified, using automatic detection...',
    );
    input = await inferPreset.inferPreset();
  }

  const preset = typeof input === 'string' ? await loadPreset(input) : input;
  validatePreset(preset);
  return preset;
};

export default resolvePreset;
