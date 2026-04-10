import type { AzionBuildPreset, PresetInput } from '@aziontech/config';
import * as presets from '@aziontech/presets';
import * as utilsNode from '@aziontech/utils/node';
import inferPreset from './infer/infer-preset';

/**
 * Loads preset by metadata name
 */
const loadPresetByMetadata = (name: string): AzionBuildPreset | undefined => {
  return Object.values(presets).find((preset) => preset.metadata?.name === name) as
    | AzionBuildPreset
    | undefined;
};

/**
 * Loads and validates preset from input
 */
export const resolvePreset = async (input?: PresetInput): Promise<AzionBuildPreset> => {
  if (input) {
    const presetName = typeof input === 'string' ? input : input.metadata?.name;
    utilsNode.feedback.build.info(`Using preset: ${presetName}`);
  }
  if (!input) {
    utilsNode.feedback.build.info('No preset specified, using automatic detection...');
    input = await inferPreset.inferPreset();
    utilsNode.feedback.build.info(`Detected preset: ${input}`);
  }

  if (typeof input === 'string') {
    const preset = loadPresetByMetadata(input);
    if (!preset) {
      throw new Error(`Invalid build preset name: '${input}'`);
    }
    return preset;
  }

  return input;
};

export default resolvePreset;
