import { readFileSync, writeFileSync } from 'fs';

/**
 * Overrides the output path for static files in a provided configuration file.
 * @
 * @function
 * @name overrideStaticOutputPath
 * @memberof utils
 * @param {string} configFilePath - The path to the configuration file to be modified.
 * @param {RegExp} regexPattern - The RegExp object to be used
 * for matching within the configuration file.
 * The regex pattern should include a capturing group (i.e., (.*) )
 * to identify the value to be replaced.
 * For example, /out:(.*)\n/.
 * @param {string} [newOutputPath='.edge/storage'] - The default is '.edge/storage'.
 * @throws Will throw an error if the function fails to override the output path.
 * @example
 *
 * overrideStaticOutputPath('./config.js', /out:(.*)\n/);
 */
function overrideStaticOutputPath(configFilePath, regexPattern, newOutputPath = '.edge/storage') {
  try {
    const fileContent = readFileSync(configFilePath, 'utf-8');

    const pattern = new RegExp(regexPattern.source, `${regexPattern.flags}g`);
    const attributeMatch = Array.from(fileContent.matchAll(pattern), (match) => match)[0];

    // find last occurrence to replace
    let newValue = attributeMatch[0];
    const contentToReplace = attributeMatch[1].trim();
    const lastIndex = newValue.lastIndexOf(contentToReplace);

    // generate new value and replace old content with new one
    if (lastIndex !== -1) {
      newValue = newValue.substring(0, lastIndex) + newOutputPath
        + newValue.substring(lastIndex, newValue.length).replace(contentToReplace, '');

      const newContent = fileContent.replace(regexPattern, newValue);

      writeFileSync(configFilePath, newContent);
    }
  } catch (error) {
    throw Error(`Error overriding the output path: ${error}`);
  }
}

export default overrideStaticOutputPath;
