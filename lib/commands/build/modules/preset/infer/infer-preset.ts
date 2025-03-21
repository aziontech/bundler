import type { AzionBuildPreset } from 'azion/config';
import * as presets from 'azion/presets';
import { join } from 'path';
import fs from 'fs';
import { extname } from 'path';
import frameworks from '../frameworks';

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
    const detectedFramework = await frameworks.listFrameworks({
      projectDir: process.cwd(),
    });

    if (detectedFramework[0]?.id) {
      const hasPreset = Object.values(presets).some(
        (preset: AzionBuildPreset) =>
          preset.metadata?.name === detectedFramework[0].id,
      );
      if (hasPreset) return detectedFramework[0].id;
    }

    // Check for TypeScript
    const tsConfigPath = join(process.cwd(), 'tsconfig.json');
    const tsConfigExists = fs.existsSync(tsConfigPath);

    if (tsConfigExists) return 'typescript';

    const files = fs.readdirSync(process.cwd());

    const hasTypeScriptFiles = files.some((file) =>
      ['.ts', '.tsx'].includes(extname(file)),
    );
    if (hasTypeScriptFiles) return 'typescript';

    return 'javascript';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return 'javascript';
  }
}

export default { inferPreset };
