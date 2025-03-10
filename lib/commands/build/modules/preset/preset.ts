import type { AzionBuildPreset, PresetInput } from 'azion/config';
import * as presets from 'azion/presets';
import { feedback } from 'azion/utils/node';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { extname } from 'path';
// @ts-expect-error - Types are not properly exported
import { listFrameworks } from '@netlify/framework-info';

/**
 * Infers the appropriate preset based on project structure and dependencies.
 * First tries to detect the framework using @netlify/framework-info.
 * If a matching preset is found for the framework, returns its ID.
 * Otherwise, checks for TypeScript configuration or files.
 * Falls back to JavaScript preset if no specific technology is detected.
 *
 * @returns Promise<string> The inferred preset name
 */

export async function inferPreset(): Promise<string> {
  try {
    // Try framework detection with @netlify/framework-info
    const detectedFramework = await listFrameworks({
      projectDir: process.cwd(),
    });
    if (detectedFramework[0]?.id) {
      const hasPreset = Object.values(presets).some(
        (preset: AzionBuildPreset) =>
          preset.metadata?.registry === detectedFramework[0].id,
      );
      if (hasPreset) return detectedFramework[0].id;
    }

    // Check for TypeScript
    const tsConfigPath = join(process.cwd(), 'tsconfig.json');
    const tsConfigExists = existsSync(tsConfigPath);
    if (tsConfigExists) return 'typescript';

    const files = readdirSync(process.cwd());
    const hasTypeScriptFiles = files.some((file) =>
      ['.ts', '.tsx'].includes(extname(file)),
    );
    if (hasTypeScriptFiles) return 'typescript';

    return 'javascript';
  } catch (error) {
    return 'javascript';
  }
}

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
    feedback.build.info('No preset specified, using automatic detection...');
    input = await inferPreset();
  }

  const preset = typeof input === 'string' ? await loadPreset(input) : input;
  validatePreset(preset);
  return preset;
};
