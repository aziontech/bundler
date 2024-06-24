import { writeFileSync, existsSync, mkdirSync } from 'fs';
import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import addKeywords from 'ajv-keywords';

import azionConfigSchema from './helpers/schema.js';
import { requestBehaviors, responseBehaviors } from './helpers/behaviors.js';
import convertLegacyConfig from './helpers/convertLegacyConfig.js';

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

  const payloadCDN = {
    origin: [],
    cache: [],
    rules: [],
  };

  // Helper function to safely evaluate mathematical expressions
  const evaluateMathExpression = (expression) => {
    if (typeof expression === 'number') {
      return expression;
    }
    if (/^[0-9+\-*/.() ]+$/.test(expression)) {
      // eslint-disable-next-line no-eval
      return eval(expression);
    }
    throw new Error(`Expression is not purely mathematical: ${expression}`);
  };

  // Convert origin settings
  if (config && config.origin && config.origin.length > 0) {
    config.origin.forEach((origin) => {
      if (origin.type !== 'object_storage' && origin.type !== 'single_origin') {
        throw new Error(
          `Rule setOrigin originType '${origin.type}' is not supported`,
        );
      }
      const originSetting = {
        name: origin.name,
        origin_type: origin.type,
      };

      if (origin.type === 'object_storage') {
        originSetting.bucket = origin.bucket;
        originSetting.prefix = origin.prefix;
      }
      if (origin.type === 'single_origin') {
        originSetting.addresses = origin.addresses?.map((address) => {
          return { address };
        });
        originSetting.host_header = origin.hostHeader;
      }
      payloadCDN.origin.push(originSetting);
    });
  }

  // Convert cache settings
  if (config && config.cache && config.cache.length > 0) {
    config.cache.forEach((cache) => {
      const maxAgeSecondsBrowser = cache?.browser
        ? evaluateMathExpression(cache.browser.maxAgeSeconds)
        : 0;
      const maxAgeSecondsEdge = cache?.edge
        ? evaluateMathExpression(cache.edge.maxAgeSeconds)
        : 60;

      const cacheSetting = {
        name: cache.name,
        browser_cache_settings: cache?.browser ? 'override' : 'honor',
        browser_cache_settings_maximum_ttl: maxAgeSecondsBrowser,
        cdn_cache_settings: cache?.edge ? 'override' : 'honor',
        cdn_cache_settings_maximum_ttl: maxAgeSecondsEdge,
        enable_caching_for_post: cache?.methods?.post || false,
        enable_caching_for_options: cache?.methods?.options || false,
        enable_query_string_sort: cache?.queryStringSort || false,
      };
      payloadCDN.cache.push(cacheSetting);
    });
  }

  // Helper function to add behaviors to a rule
  const addBehaviors = (cdnRule, behaviors, behaviorDefinitions) => {
    if (behaviors && typeof behaviors === 'object') {
      Object.entries(behaviors).forEach(([key, value]) => {
        if (behaviorDefinitions[key]) {
          const transformedBehavior = behaviorDefinitions[key].transform(
            value,
            payloadCDN,
          );
          if (Array.isArray(transformedBehavior)) {
            cdnRule.behaviors.push(...transformedBehavior);
          } else if (transformedBehavior) {
            cdnRule.behaviors.push(transformedBehavior);
          }
        } else {
          console.warn(`Unknown behavior: ${key}`);
        }
      });
    }
  };

  // Convert request rules
  config?.rules?.request?.forEach((rule, index) => {
    const cdnRule = {
      name: rule.name,
      phase: 'request',
      description: rule.description ?? '',
      is_active: rule.active !== undefined ? rule.active : true, // Default to true if not provided
      order: index + 2, // index starts at 2, because the default rule is index 1
      criteria: [
        [
          {
            variable: `\${${rule.variable ?? 'uri'}}`,
            operator: 'matches',
            conditional: 'if',
            input_value: rule.match,
          },
        ],
      ],
      behaviors: [],
    };

    addBehaviors(cdnRule, rule.behavior, requestBehaviors);

    payloadCDN.rules.push(cdnRule);
  });

  // Convert response rules
  if (config?.rules?.response) {
    config.rules.response.forEach((rule, index) => {
      const cdnRule = {
        name: rule.name,
        phase: 'response',
        description: rule.description ?? '',
        is_active: rule.active !== undefined ? rule.active : true, // Default to true if not provided
        order: index + 2, // index starts at 2, because the default rule is index 1
        criteria: [
          [
            {
              variable: `\${${rule.variable ?? 'uri'}}`,
              operator: 'matches',
              conditional: 'if',
              input_value: rule.match,
            },
          ],
        ],
        behaviors: [],
      };

      addBehaviors(cdnRule, rule.behavior, responseBehaviors);

      payloadCDN.rules.push(cdnRule);
    });
  }

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
