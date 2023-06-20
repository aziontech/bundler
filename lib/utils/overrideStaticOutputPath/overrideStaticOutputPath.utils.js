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

    const newValue = attributeMatch[0].replace(attributeMatch[1].trim(), newOutputPath);

    const newContent = fileContent.replace(regexPattern, newValue);

    writeFileSync(configFilePath, newContent);
  } catch (error) {
    throw Error(`Error overriding the output path: ${error}`);
  }
}

export default overrideStaticOutputPath;
