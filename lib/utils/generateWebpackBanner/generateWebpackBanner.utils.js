import { readFileSync } from 'fs';

import { Utils } from '#namespaces';

/**
 * @function
 * @memberof Utils
 * @description Generate code to inject in webpack build result initial part.
 * @param {string[]} filesPaths File paths to use in banner.
 * @returns {string} the created content to inject.
 */
function generateWebpackBanner(filesPaths) {
  let content = '';

  filesPaths.forEach((filePath) => {
    content += `${readFileSync(filePath, 'utf-8')}\n`;
  });

  return content;
}

export default generateWebpackBanner;
