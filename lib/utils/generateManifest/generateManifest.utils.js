import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// TODO: Maybe... Yup?
const validProperties = {
  global: ['cache', 'rules'],
  cache: ['name', 'stale', 'queryStringSort', 'methods', 'browser', 'edge'],
  methods: ['post', 'options'],
  browser: ['maxAgeSeconds'],
  edge: ['maxAgeSeconds'],
  rules: ['request'],
  request: [
    'match',
    'setOrigin',
    'cache',
    'rewrite',
    'setCookie',
    'setHeaders',
    'forwardCookies',
    'behaviors',
  ],
  setOrigin: ['name', 'type', 'bucket', 'prefix'],
  rewrite: ['match', 'set'],
  cacheDirect: [
    'name',
    'browser_cache_settings_maximum_ttl',
    'cdn_cache_settings_maximum_ttl',
  ],
  behaviors: ['name', 'target'],
};

/**
 * Recursively validates the properties of a configuration object against a set of valid keys.
 * This function is designed to ensure that the provided configuration object adheres to an expected structure,
 * throwing an error if an invalid property is encountered. It supports validation of nested objects and arrays,
 * allowing for detailed checks of complex configuration structures.
 * @param {object | Array} object - The object or array to be validated. If an object, its keys are checked against
 *                                the provided set of valid keys. If an array, each element is validated recursively.
 * @param {string[]} validKeys - An array of strings representing the valid keys for the current level of the object.
 *                               These keys are used to verify that the object's properties conform to the expected
 *                               structure.
 * @param {string} [path=''] - A string representing the current navigation path within the configuration object.
 *                             Used primarily to provide detailed error messages indicating the exact location of
 *                             an invalid property within the object's structure.
 * @throws {Error} Throws an error if an invalid property is found, including details about the path of the
 *                 invalid property to aid in debugging.
 */
function validateProperties(object, validKeys, path = '') {
  if (Array.isArray(object)) {
    object.forEach((item, index) => {
      validateProperties(item, validKeys, `${path}[${index}]`);
    });
  } else if (typeof object === 'object' && object !== null) {
    Object.keys(object).forEach((key) => {
      const fullPath = path ? `${path}.${key}` : key;
      if (!validKeys.includes(key)) {
        throw new Error(`Invalid property found: ${fullPath}`);
      }

      let nextKeys = validProperties[key] || [];
      if (path.includes('rules.request') && key === 'cache') {
        nextKeys = validProperties.cacheDirect;
      }
      validateProperties(object[key], nextKeys, fullPath);
    });
  }
}

/**
 * Converts the custom configuration to the format expected by the CDN.
 * This function processes the custom configuration module to adapt it to the CDN's expected format.
 * It evaluates mathematical expressions, validates types, and transforms configurations for caching and rules.
 * @param {object} config - The configuration object read from the custom configuration module.
 * @returns {object} The converted configuration object suitable for the CDN.
 */
function processManifestConfig(config) {
  validateProperties(config, validProperties.global);

  const payloadCDN = {
    rules: [],
    cacheSettings: [],
  };

  // Helper function to safely evaluate mathematical expressions
  const evaluateMathExpression = (expression) => {
    if (expression === undefined) return 0; // Returns 0 if the expression is undefined
    if (/^[0-9+\-*/.() ]+$/.test(expression)) {
      // eslint-disable-next-line no-eval
      return eval(expression);
    }
    throw new Error(`Expression is not purely mathematical: ${expression}`);
  };

  // Helper function to validate types
  const validateType = (value, type) => {
    switch (type) {
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'string':
        return typeof value === 'string';
      default:
        throw new Error(`Unsupported type for validation: ${type}`);
    }
  };

  // Convert cache settings
  if (config && config.cache && config.cache.length > 0) {
    config.cache.forEach((cache) => {
      if (!validateType(cache.name, 'string')) {
        throw new Error(`Invalid cache name: ${cache.name}`);
      }
      const maxAgeSecondsBrowser = evaluateMathExpression(
        cache?.browser?.maxAgeSeconds,
      );
      const maxAgeSecondsEdge = evaluateMathExpression(
        cache?.edge?.maxAgeSeconds,
      );

      const cacheSetting = {
        name: cache.name,
        browser_cache_settings_maximum_ttl: maxAgeSecondsBrowser,
        cdn_cache_settings_maximum_ttl: maxAgeSecondsEdge,
        enable_caching_for_post: cache?.methods?.post || false,
        enable_caching_for_options: cache?.methods?.options || false,
        enable_query_string_sort: cache?.queryStringSort || false,
      };
      payloadCDN.cacheSettings.push(cacheSetting);
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
      if (!rule.rewrite.set) {
        throw new Error('The "set" property is mandatory within "rewrite".');
      }
      const functionString = rule.rewrite.set.toString();
      const paramNameMatch = functionString.match(/\(([^)]+)\)/);
      let paramName = paramNameMatch ? paramNameMatch[1] : null;
      if (paramName) {
        // eslint-disable-next-line prefer-destructuring
        paramName = paramName.trim().split(/\s*,\s*/)[0];
      }

      if (rule.rewrite.match) {
        cdnRule.behaviors.push({
          name: 'capture_match_groups',
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
        name: 'rewrite_request',
        target: pathTransformation,
      });
    }

    // Cache handling within rules
    if (typeof rule.cache === 'string') {
      cdnRule.behaviors.push({
        name: 'set_cache_policy',
        target: rule.cache,
      });
    } else if (typeof rule.cache === 'object') {
      // Adds the cache object to the cacheSettings array
      const cacheSetting = {
        name: rule.cache?.name,
        ...rule.cache, // Here you can expand or adjust fields as necessary
      };
      payloadCDN.cacheSettings.push(cacheSetting);
      // Adds the set_cache_policy behavior with the generated cache name
      cdnRule.behaviors.push({
        name: 'set_cache_policy',
        target: rule.cache?.name,
      });
      // Updates the rule to use the generated cache name
      // eslint-disable-next-line no-param-reassign
      rule.cache = rule.cache?.name;
    }

    if (Object.prototype.hasOwnProperty.call(rule, 'forwardCookies')) {
      if (!validateType(rule.forwardCookies, 'boolean')) {
        throw new Error(
          `Invalid type for forwardCookies: ${typeof rule.forwardCookies}. Expected boolean.`,
        );
      }
      if (rule.forwardCookies) {
        cdnRule.behaviors.push({
          name: 'forward_cookies',
          target: rule.forwardCookies,
        });
      }
    }

    if (rule.setOrigin) {
      if (!rule.setOrigin.type) {
        throw new Error('The "type" property is mandatory within "setOrigin".');
      }

      const originBehavior = {
        name: 'set_origin',
        target: {
          origin_type: rule.setOrigin.type,
          bucket: rule.setOrigin.bucket || '',
          prefix: rule.setOrigin.prefix || '/',
        },
      };

      // Validating that all properties are strings
      Object.entries(originBehavior.target).forEach(([key, value]) => {
        if (typeof value !== 'string') {
          throw new Error(
            `The "${key}" property in "setOrigin" must be a string.`,
          );
        }
      });

      cdnRule.behaviors.push(originBehavior);
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
  const manifestPath = join(process.cwd(), '.edge/cdn.json');
  let existingManifest = { rules: [], cacheSettings: [] };

  if (existsSync(manifestPath)) {
    const existingManifestRaw = readFileSync(manifestPath, 'utf8');
    existingManifest = JSON.parse(existingManifestRaw);
  }

  const newManifestConfig = processManifestConfig(configModule);
  const cacheSettingsMap = {};
  existingManifest.cacheSettings.forEach((setting) => {
    cacheSettingsMap[setting.name] = setting;
  });
  newManifestConfig.cacheSettings.forEach((setting) => {
    cacheSettingsMap[setting.name] = setting;
  });

  const rulesMap = {};
  existingManifest.rules.forEach((rule) => {
    rulesMap[rule.criteria.input_value] = rule;
  });
  newManifestConfig.rules.forEach((rule) => {
    rulesMap[rule.criteria.input_value] = rule;
  });

  const mergedConfig = {
    cacheSettings: Object.values(cacheSettingsMap),
    rules: Object.values(rulesMap),
  };

  writeFileSync(manifestPath, JSON.stringify(mergedConfig, null, 2));
}

export { processManifestConfig, generateManifest };
