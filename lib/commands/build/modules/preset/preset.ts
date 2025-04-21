import type { AzionBuildPreset, PresetInput } from 'azion/config';
import * as presets from 'azion/presets';
import * as utilsNode from 'azion/utils/node';
import inferPreset from './infer/infer-preset';

/**
 * Loads preset files by name
 */
const loadPreset = async (presetName: string): Promise<AzionBuildPreset> => {
  const normalizedName = presetName.toLowerCase();
  return presets[normalizedName as keyof typeof presets] as unknown as AzionBuildPreset;
};

/**
 * Loads and validates preset from input
 */
export const resolvePreset = async (input?: PresetInput): Promise<AzionBuildPreset> => {
  if (input) {
    utilsNode.feedback.build.info(
      `Using preset: ${typeof input === 'string' ? input : input.metadata?.name || 'custom'}`,
    );
  }
  if (!input) {
    utilsNode.feedback.build.info('No preset specified, using automatic detection...');
    input = await inferPreset.inferPreset();
    utilsNode.feedback.build.info(`Detected preset: ${input}`);
  }

  const validPresets = Object.keys(presets);

  if (typeof input === 'string') {
    if (!validPresets.includes(input)) {
      throw new Error(`Invalid build preset name: '${input}'`);
    }

    const preset = await loadPreset(input);
    return preset;
  }

  return input;
};

export default resolvePreset;
