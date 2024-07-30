import ManifestStrategy from '../manifestStrategy.js';
import {
  requestBehaviors,
  responseBehaviors,
} from '../../helpers/behaviors.js';

/**
 * RulesManifestStrategy
 * @class RulesManifestStrategy
 * @description This class is implementation of the Rules Manifest Strategy.
 */
class RulesManifestStrategy extends ManifestStrategy {
  /**
   * Adds behaviors to the CDN rule.
   * @param {object} cdnRule - The CDN rule.
   * @param {object} behaviors - The behaviors.
   * @param {object} behaviorDefinitions - The behavior definitions.
   * @param {object} payloadContext - The payload context.
   * @returns {void}
   */
  // eslint-disable-next-line class-methods-use-this
  #addBehaviors(cdnRule, behaviors, behaviorDefinitions, payloadContext) {
    if (behaviors && typeof behaviors === 'object') {
      Object.entries(behaviors).forEach(([key, value]) => {
        if (behaviorDefinitions[key]) {
          const transformedBehavior = behaviorDefinitions[key].transform(
            value,
            payloadContext,
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
  }

  /**
   * Generates the rules manifest based on the configuration.
   * @param {object} config - The configuration object.
   * @param {object} context - The context object.
   * @returns {object} The generated rules manifest.
   */
  generate(config, context) {
    const payload = [];
    // request
    if (Array.isArray(config?.rules?.request)) {
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
        this.#addBehaviors(cdnRule, rule.behavior, requestBehaviors, context);
        payload.push(cdnRule);
      });
    }

    // response
    if (Array.isArray(config?.rules?.response)) {
      config?.rules?.response.forEach((rule, index) => {
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
        this.#addBehaviors(cdnRule, rule.behavior, responseBehaviors, context);
        payload.push(cdnRule);
      });
    }

    return payload;
  }
}

export default RulesManifestStrategy;
