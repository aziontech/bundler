import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { processConfig } from 'azion';

/**
 * Generates or updates the CDN manifest based on a custom configuration module.
 * This function is typically called during the prebuild stage to prepare the CDN configuration.
 * It attempts to load the configuration from a file with extensions .js, .mjs, or .cjs based on the module system used.
 * @param {object} configModule - The custom configuration module provided by the user.
 * @param {string} outputPath - The path where the final manifest should be written.
 * @async
 */
async function generateManifest(configModule, outputPath) {
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath);
  }

  const manifest = processConfig(configModule);
  writeFileSync(
    `${outputPath}/manifest.json`,
    JSON.stringify(manifest, null, 2),
  );
}

export { generateManifest };
export default generateManifest;
