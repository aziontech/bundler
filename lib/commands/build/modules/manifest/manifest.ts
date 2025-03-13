import { type AzionConfig, processConfig } from 'azion/config';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Generates or updates the CDN manifest based on a custom configuration module.
 * This function is typically called during the build stage to prepare the CDN configuration.
 *
 * @param config - Build configuration object
 * @param outputPath - Optional output path for the manifest file
 */
export const generateManifest = async (
  config: AzionConfig,
  outputPath = join(process.cwd(), '.edge'),
): Promise<void> => {
  // Ensure output directory exists
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath, { recursive: true });
  }

  // Process and transform config into manifest
  const manifest = processConfig(config);
  // Write manifest to file
  const manifestPath = join(outputPath, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
};

export default generateManifest;
