import { readFileSync, writeFileSync } from 'fs';

/**
 * Overrides static files output path in config file.
 * @param {string} configFilePath - The config file path to be overrided.
 * @param {object} regexPattern - The regex pattern to be detected.
 * @param {string} newValue - The new attribute value.
 */
function overrideStaticOutputPath(configFilePath, regexPattern, newValue) {
  const fileContent = readFileSync(configFilePath, 'utf-8');
  const newContent = fileContent.replace(regexPattern, `${newValue}`);

  writeFileSync(configFilePath, newContent);
}

export default overrideStaticOutputPath;
