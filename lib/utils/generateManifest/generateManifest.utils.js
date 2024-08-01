import { writeFileSync, existsSync, mkdirSync } from 'fs';
import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import addKeywords from 'ajv-keywords';

import azionConfigSchema from './helpers/schema.js';
import convertLegacyConfig from './helpers/convertLegacyConfig.js';
import ManifestContext from './strategy/manifestContext.js';
import OriginManifestStrategy from './strategy/implementations/originManifestStrategy.js';
import CacheManifestStrategy from './strategy/implementations/cacheManifestStrategy.js';
import RulesManifestStrategy from './strategy/implementations/rulesManifestStrategy.js';
import DomainManisfestStrategy from './strategy/implementations/domainManifestStrategy.js';

/**
 * Validates the provided configuration against a JSON Schema.
 * This function uses AJV (Another JSON Schema Validator) to validate the configuration.
 * If the configuration is not valid, an exception is thrown with the error message of the first validation issue encountered.
 * @param {object} config - The configuration object to be validated.
 * @throws {Error} Throws an error if the configuration fails validation.
 */
function validateConfig(config) {
  const ajv = new Ajv({ allErrors: true, $data: true });
  ajvErrors(ajv);
  addKeywords(ajv, ['instanceof']);
  const validate = ajv.compile(azionConfigSchema);
  const valid = validate(config);

  if (!valid) {
    throw new Error(validate.errors[0].message);
  }
}

/**
 * Converts the custom configuration to the format expected by the Azion CDN (see https://api.azion.com/).
 * This function processes the custom configuration module to adapt it to the CDN's expected format.
 * It evaluates mathematical expressions, validates types, and transforms configurations for caching and rules.
 * @param {object} inputConfig - The configuration object read from the custom configuration module.
 * @returns {object} The converted configuration object suitable for the CDN.
 */
function jsToJson(inputConfig) {
  /*  Converts legacy configuration properties to the new `behavior` format. */
  const config = convertLegacyConfig(inputConfig);
  validateConfig(config);

  const payloadCDN = {};

  // Manifest Strategy Pattern
  const manifestContext = new ManifestContext();
  manifestContext.setStrategy('origin', new OriginManifestStrategy());
  manifestContext.setStrategy('cache', new CacheManifestStrategy());
  manifestContext.setStrategy('domain', new DomainManisfestStrategy());

  // Rules must be last to apply to behaviors (origin, cache...)
  manifestContext.setStrategy('rules', new RulesManifestStrategy());
  manifestContext.generate(config, payloadCDN);

  return payloadCDN;
}

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

  const manifest = jsToJson(configModule);
  writeFileSync(
    `${outputPath}/manifest.json`,
    JSON.stringify(manifest, null, 2),
  );
}

export { generateManifest, jsToJson };
export default generateManifest;
