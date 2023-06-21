import { readFileSync, writeFileSync } from 'fs';

/**
 * Overrides static files output path in config file.
 * @param {string} configFilePath - The config file path to be overrided.
 * @param {object} regexPattern - The regex pattern to be detected.
 * You must use (.*) to detect the value to replace, ex.: /out:(.*)\n/
 * @param {string} newOutputPath - The new attribute value.
 */
function overrideStaticOutputPath(configFilePath, regexPattern, newOutputPath = '.edge/statics') {
  try {
    const fileContent = readFileSync(configFilePath, 'utf-8');

    const pattern = new RegExp(regexPattern.source, `${regexPattern.flags}g`);
    const attributeMatch = Array.from(fileContent.matchAll(pattern), (match) => match)[0];

    // find last occurence to replace
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
