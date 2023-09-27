import { debug } from '#utils';
import { Platform } from '#namespaces';
import ApplicationService from '../../services/application.service.js';

/**
 * @function
 * @memberof Platform
 * @description Sets a function as the default rule in an application's rules engine.
 * @param {number} applicationId - The ID of the application.
 * @param {number} functionInstanceId - The ID of the edge function instance.
 * @returns {Promise<object>} The updated rules engine rules.
 */
async function setFunctionAsDefaultRule(applicationId, functionInstanceId) {
  try {
    const rulesResponse = await (
      await ApplicationService.getRules(applicationId)
    ).json();
    const defaultRuleId = rulesResponse.results[0].id;

    const payload = {
      behaviors: [
        {
          name: 'run_function',
          target: functionInstanceId,
        },
      ],
    };

    const response = await (
      await ApplicationService.updateRule(applicationId, defaultRuleId, payload)
    ).json();
    return response.results;
  } catch (error) {
    debug.error(error);
    throw error;
  }
}

export default setFunctionAsDefaultRule;
