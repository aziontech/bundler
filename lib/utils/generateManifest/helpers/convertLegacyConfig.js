/**
 * Converts legacy configuration to the new format by moving old properties into the `behavior` object.
 * This ensures backward compatibility for projects that do not use the `behavior` field.
 * @param {object} config - The configuration object to be converted.
 * @returns {object} The converted configuration object with `behavior` properties.
 */
function convertLegacyConfig(config) {
  const newConfig = { ...config };

  // Define the properties that should be moved to the behavior object for request and response
  const requestBehaviorProperties = [
    'httpToHttps',
    'bypassCache',
    'forwardCookies',
    'capture',
    'setOrigin',
    'rewrite',
    'setCookie',
    'setHeaders',
    'runFunction',
    'setCache',
    'redirectTo301',
    'redirectTo302',
    'deliver',
  ];

  const responseBehaviorProperties = [
    'enableGZIP',
    'capture',
    'setCookie',
    'setHeaders',
    'filterHeader',
    'filterCookie',
    'runFunction',
    'redirectTo301',
    'redirectTo302',
    'deliver',
  ];

  const convertRules = (rules, behaviorProperties) => {
    return rules.map((rule) => {
      const newRule = { ...rule, behavior: { ...rule.behavior } };

      // Preserve the order of properties
      Object.keys(rule).forEach((prop) => {
        if (behaviorProperties.includes(prop)) {
          newRule.behavior[prop] = rule[prop];
          delete newRule[prop];
        }
      });

      return newRule;
    });
  };

  if (newConfig.rules && newConfig.rules.request) {
    newConfig.rules.request = convertRules(
      newConfig.rules.request,
      requestBehaviorProperties,
    );
  }

  if (newConfig.rules && newConfig.rules.response) {
    newConfig.rules.response = convertRules(
      newConfig.rules.response,
      responseBehaviorProperties,
    );
  }
  return newConfig;
}

export default convertLegacyConfig;
