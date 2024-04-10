import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import addKeywords from 'ajv-keywords';

import azionConfigSchema from './fixtures/schema.js';

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
 * @param {object} config - The configuration object read from the custom configuration module.
 * @returns {object} The converted configuration object suitable for the CDN.
 */
function processManifestConfig(config) {
  validateConfig(config);

  const payloadCDN = {
    origin: [],
    rules: [],
    cache: [],
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
      const maxAgeSecondsBrowser = evaluateMathExpression(
        cache?.browser?.maxAgeSeconds,
      );
      const maxAgeSecondsEdge = evaluateMathExpression(
        cache?.edge?.maxAgeSeconds,
      );

      const cacheSetting = {
        name: cache.name,
        browser_cache_settings: 'override',
        browser_cache_settings_maximum_ttl: maxAgeSecondsBrowser,
        cdn_cache_settings_maximum_ttl: maxAgeSecondsEdge,
        enable_caching_for_post: cache?.methods?.post || false,
        enable_caching_for_options: cache?.methods?.options || false,
        enable_query_string_sort: cache?.queryStringSort || false,
      };
      payloadCDN.cache.push(cacheSetting);
    });
  }

  // Convert rules
  config?.rules?.request?.forEach((rule) => {
    const cdnRule = {
      criteria: {
        // eslint-disable-next-line no-template-curly-in-string
        variable: '${uri}',
        operator: 'matches',
        conditional: 'if',
        input_value: rule.match,
      },
      behaviors: rule.behaviors ? [...rule.behaviors] : [],
    };

    // Add specific behaviors for the rewrite rule
    if (rule.rewrite) {
      const functionString = rule.rewrite.set.toString();
      const paramNameMatch = functionString.match(/\(([^)]+)\)/);
      let paramName = paramNameMatch ? paramNameMatch[1] : null;
      if (paramName) {
        // eslint-disable-next-line prefer-destructuring
        paramName = paramName.trim().split(/\s*,\s*/)[0];
      }

      if (rule.rewrite.match) {
        cdnRule.behaviors.push({
          rule: 'capture_match_groups',
          target: {
            captured_array: paramName || 'captured',
            // eslint-disable-next-line no-template-curly-in-string
            subject: '${uri}',
            regex: rule.rewrite.match,
          },
        });
      }
      // Transform the set function into a replacement string
      const pathTransformation = functionString
        .replace(/.*=>\s*`/, '') // Remove the function part up to the template string
        .replace(/`\s*;?\s*}?\s*$/, '') // Removes the end of the template string and possible function closures
        .replace(/\$\{([^}]+)\}/g, (match, p1) => `%{${p1}}`); // Replace ${other[index]} with %{other[index]}

      cdnRule.behaviors.push({
        rule: 'rewrite_request',
        target: pathTransformation,
      });
    }

    // Cache handling within rules
    if (typeof rule.cache === 'string') {
      cdnRule.behaviors.push({
        rule: 'set_cache_policy',
        target: rule.cache,
      });
    } else if (typeof rule.cache === 'object') {
      // Adds the cache object to the cache array
      const cacheSetting = {
        name: rule.cache?.name,
        ...rule.cache, // Here you can expand or adjust fields as necessary
      };
      payloadCDN.cache.push(cacheSetting);
      // Adds the set_cache_policy behavior with the generated cache name
      cdnRule.behaviors.push({
        rule: 'set_cache_policy',
        target: rule.cache?.name,
      });
      // Updates the rule to use the generated cache name
      // eslint-disable-next-line no-param-reassign
      rule.cache = rule.cache?.name;
    }

    if (Object.prototype.hasOwnProperty.call(rule, 'forwardCookies')) {
      if (rule.forwardCookies) {
        cdnRule.behaviors.push({
          rule: 'forward_cookies',
          target: null,
        });
      }
    }

    if (rule.setOrigin) {
      const origin = payloadCDN.origin.find(
        (o) =>
          o.name === rule.setOrigin.name &&
          o.origin_type === rule.setOrigin.type,
      );

      if (!origin) {
        throw new Error(
          `Rule setOrigin name '${rule.setOrigin.name}' not found in the origin settings`,
        );
      } else if (origin.origin_type !== rule.setOrigin.type) {
        throw new Error(
          `Rule setOrigin originType '${rule.setOrigin.type}' does not match the origin settings`,
        );
      }

      const originBehavior = {
        name: 'set_origin',
        target: origin.name,
      };

      cdnRule.behaviors.push(originBehavior);
    }

    if (rule.runFunction) {
      const runFunctionBehavior = {
        rule: 'run_function',
        target: rule.runFunction.path,
      };

      if (rule.runFunction.name) {
        runFunctionBehavior.name = rule.runFunction.name;
      }

      cdnRule.behaviors.push(runFunctionBehavior);
    }

    if (rule.deliver) {
      cdnRule.behaviors.push({
        rule: 'deliver',
      });
    }

    if (rule.setCookie) {
      const cookieBehavior = {
        rule: 'add_request_cookie',
        target: rule.setCookie,
      };
      cdnRule.behaviors.push(cookieBehavior);
    }

    if (rule.setHeaders) {
      const headersBehavior = {
        rule: 'add_request_header',
        target: rule.setHeaders,
      };
      cdnRule.behaviors.push(headersBehavior);
    }

    payloadCDN.rules.push(cdnRule);
  });

  return payloadCDN;
}

/**
 * Generates or updates the CDN manifest based on a custom configuration module.
 * If an existing manifest is found, it merges the configurations, prioritizing the custom module.
 * This function is typically called during the prebuild stage to prepare the CDN configuration.
 * @param {object} configModule - The custom configuration module provided by the user.
 * @async
 */
async function generateManifest(configModule) {
  const edgeDirPath = join(process.cwd(), '.edge');
  const manifestPath = join(edgeDirPath, 'manifest.json');

  //  preset configuration (existingManifest) have priority over user azion.config.js
  let existingManifest = { origin: [], rules: [], cache: [] };

  if (!existsSync(edgeDirPath)) {
    mkdirSync(edgeDirPath);
  }

  if (existsSync(manifestPath)) {
    const existingManifestRaw = readFileSync(manifestPath, 'utf8');
    existingManifest = JSON.parse(existingManifestRaw);
  }

  const newManifestConfig = processManifestConfig(configModule);
  const originMap = {};
  existingManifest?.origin?.forEach((setting) => {
    originMap[setting.name] = setting;
  });
  newManifestConfig?.origin?.forEach((setting) => {
    originMap[setting.name] = setting;
  });

  const cacheMap = {};
  existingManifest?.cache?.forEach((setting) => {
    cacheMap[setting.name] = setting;
  });
  newManifestConfig?.cache?.forEach((setting) => {
    cacheMap[setting.name] = setting;
  });

  const rulesMap = {};
  existingManifest?.rules?.forEach((rule) => {
    rulesMap[rule.criteria.input_value] = rule;
  });
  newManifestConfig?.rules?.forEach((rule) => {
    rulesMap[rule.criteria.input_value] = rule;
  });

  const mergedConfig = {
    origin: Object.values(originMap),
    cache: Object.values(cacheMap),
    rules: Object.values(rulesMap),
  };

  writeFileSync(manifestPath, JSON.stringify(mergedConfig, null, 2));
}

export { processManifestConfig, generateManifest };
