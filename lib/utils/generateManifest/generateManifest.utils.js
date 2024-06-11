import { writeFileSync, existsSync, mkdirSync } from 'fs';
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
function jsToJson(config) {
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

  // Convert request rules
  config?.rules?.request?.forEach((rule) => {
    const cdnRule = {
      name: rule.name,
      phase: 'request',
      criteria: [
        [
          {
            // eslint-disable-next-line no-template-curly-in-string
            variable: `\${${rule.variable ?? 'uri'}}`,
            operator: 'matches',
            conditional: 'if',
            input_value: rule.match,
          },
        ],
      ],
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
          name: 'capture_match_groups',
          target: {
            captured_array: paramName || 'captured',
            // eslint-disable-next-line no-template-curly-in-string
            variable: `\${${rule.variable ?? 'uri'}}`,
            regex: rule.rewrite.match,
          },
        });
      }
      // Transform the set function into a replacement string
      const pathTransformation = functionString
        .replace(/.*=>\s*`/, '') // Remove the function part up to the template string
        .replace(/`\s*;?\s*}?\s*$/, '') // Removes the end of the template string and possible function closures
        .replace(/\$\{([^}]+)\}/g, (match, p1) => `\${${p1}}`); // Replace ${other[index]} with %{other[index]}

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
      // Adds the cache object to the cache array
      const cacheSetting = {
        name: rule.cache?.name,
        ...rule.cache, // Here you can expand or adjust fields as necessary
      };
      payloadCDN.cache.push(cacheSetting);
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
      if (rule.forwardCookies) {
        cdnRule.behaviors.push({
          name: 'forward_cookies',
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
        name: 'run_function',
        target: rule.runFunction.path,
      };

      cdnRule.behaviors.push(runFunctionBehavior);
    }

    if (Object.prototype.hasOwnProperty.call(rule, 'deliver')) {
      if (rule.deliver) {
        cdnRule.behaviors.push({
          name: 'deliver',
          target: null,
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(rule, 'enableGZIP')) {
      if (rule.enableGZIP) {
        cdnRule.behaviors.push({
          name: 'enable_gzip',
          target: '',
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(rule, 'bypassCache')) {
      if (rule.bypassCache) {
        cdnRule.behaviors.push({
          name: 'bypass_cache_phase',
          target: null,
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(rule, 'httpToHttps')) {
      if (rule.httpToHttps) {
        cdnRule.behaviors.push({
          name: 'redirect_http_to_https',
          target: null,
        });
      }
    }

    if (rule.redirectTo301) {
      cdnRule.behaviors.push({
        name: 'redirect_to_301',
        target: rule.redirectTo301,
      });
    }

    if (rule.redirectTo302) {
      cdnRule.behaviors.push({
        name: 'redirect_to_302',
        target: rule.redirectTo302,
      });
    }

    if (rule.setCookie) {
      const cookieBehavior = {
        name: 'add_request_cookie',
        target: rule.setCookie,
      };
      cdnRule.behaviors.push(cookieBehavior);
    }

    if (rule.setHeaders) {
      rule.setHeaders.forEach((header) => {
        cdnRule.behaviors.push({
          name: 'add_request_header',
          target: header,
        });
      });
    }

    if (rule.capture) {
      cdnRule.behaviors.push({
        name: 'capture_match_groups',
        target: {
          regex: rule.capture.regex,
          captured_array: rule.capture.captured,
          subject: rule.capture.subject,
        },
      });
    }

    payloadCDN.rules.push(cdnRule);
  });

  // response rules
  if (config?.rules?.response) {
    config.rules.response.forEach((rule) => {
      const cdnRule = {
        name: rule.name,
        phase: 'response',
        behaviors: [],
        criteria: rule.criteria || [],
        is_active: true,
        description: rule.description || '',
      };

      if (rule.setCookie) {
        cdnRule.behaviors.push({
          name: 'add_response_cookie',
          target: rule.setCookie,
        });
      }

      if (rule.setHeaders) {
        rule.setHeaders.forEach((header) => {
          cdnRule.behaviors.push({
            name: 'add_response_header',
            target: header,
          });
        });
      }

      if (Object.prototype.hasOwnProperty.call(rule, 'enableGZIP')) {
        if (rule.enableGZIP) {
          cdnRule.behaviors.push({
            name: 'enable_gzip',
            target: '',
          });
        }
      }

      if (rule.filterCookie) {
        cdnRule.behaviors.push({
          name: 'filter_response_cookie',
          target: rule.filterCookie,
        });
      }

      if (rule.filterHeader) {
        cdnRule.behaviors.push({
          name: 'filter_response_header',
          target: rule.filterHeader,
        });
      }

      if (Object.prototype.hasOwnProperty.call(rule, 'deliver')) {
        if (rule.deliver) {
          cdnRule.behaviors.push({
            name: 'deliver',
            target: null,
          });
        }
      }

      if (rule.runFunction) {
        cdnRule.behaviors.push({
          name: 'run_function',
          target: rule.runFunction.path,
        });
      }

      if (rule.redirectTo301) {
        cdnRule.behaviors.push({
          name: 'redirect_to_301',
          target: rule.redirectTo301,
        });
      }

      if (rule.redirectTo302) {
        cdnRule.behaviors.push({
          name: 'redirect_to_302',
          target: rule.redirectTo302,
        });
      }

      if (rule.capture) {
        cdnRule.behaviors.push({
          name: 'capture_match_groups',
          target: {
            regex: rule.capture.regex,
            captured_array: rule.capture.captured,
            subject: rule.capture.subject,
          },
        });
      }

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
