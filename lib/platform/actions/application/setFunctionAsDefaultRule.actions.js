import ApplicationService from '../../services/application.service.js';
/**
 * Sets a function as the default rule in an application's rules engine.
 * @param {number} applicationId - The ID of the application.
 * @param {number} functionInstanceId - The ID of the edge function instance.
 * @returns {Promise<object>} The updated rules engine rules.
 */
async function setFunctionAsDefaultRule(applicationId, functionInstanceId) {
  const rulesResponse = await ApplicationService.getRules(applicationId);
  const defaultRuleId = rulesResponse.results[0].id;

  const payload = {
    behaviors: [
      {
        name: 'run_function',
        target: functionInstanceId,
      },
    ],
  };

  return ApplicationService.updateRule(applicationId, defaultRuleId, payload);
}

export default setFunctionAsDefaultRule;
