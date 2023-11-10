import { join } from 'path';
import { writeFileSync } from 'fs';
import { Utils } from '#namespaces';

/**
 * @function
 * @memberof Utils
 * @description Generates manifest object and writes it to a file.
 * @param {string} route - the route to be used,  or all represented by '*'
 * @param {string} filePath - the file path for the route, or all represented by '*'
 * @param {string} mode - The mode of the operation, either 'compute', 'deliver', or both represented by '*'.
 */
function generateManifest(route, filePath, mode) {
  const manifestPath = join(process.cwd(), '.edge/manifest.json');
  const manifest = {};

  // Check the mode and add the route to the manifest appropriately.
  if (mode === 'compute' || mode === 'deliver' || mode === '*') {
    manifest[mode] = {};
    manifest[mode][route] = filePath;
  } else {
    throw new Error('Invalid mode. Must be "compute", "deliver", or "*".');
  }

  // Write the new manifest back to the file.
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`New manifest created with ${mode} information.`);
}

export default generateManifest;
