import { type AzionConfig } from 'azion/config';
import fs from 'fs';
import { join } from 'path';
import util from './util';

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
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Process and transform config into manifest
  const manifest = util.processConfigWrapper(config);

  // Write manifest to file
  const manifestPath = join(outputPath, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
};

export default generateManifest;
