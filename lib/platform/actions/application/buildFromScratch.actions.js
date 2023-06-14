import ApplicationService from '../../services/application.service.js';
import createDomain from '../domain/createDomain.actions.js';

/**
 * Creates a new application.
 * @param {string} applicationName - The name of the application to be created.
 * @returns {Promise<object>} The created application.
 */
async function createApplication(applicationName) {
  const payload = {
    name: applicationName,
    delivery_protocol: 'http,https',
  };
  return ApplicationService.create(payload);
}

/**
 * Enables edge functions in an application.
 * @param {number} applicationId - The ID of the application.
 * @returns {Promise<object>} The updated application with edge functions enabled.
 */
async function enableEdgeFunctions(applicationId) {
  const payload = {
    edge_functions: true,
  };
  return ApplicationService.update(applicationId, payload);
}

/**
 * Instantiates an edge function in an application.
 * @param {number} functionId - The ID of the function to be instantiated.
 * @param {number} applicationId - The ID of the application.
 * @returns {Promise<object>} The instantiated edge function.
 */
async function instantiateFunction(functionId, applicationId) {
  const payload = {
    edge_function_id: functionId,
    args: {},
  };
  return ApplicationService.instantiate(applicationId, payload);
}

/**
 * Updates the rules engine in an application.
 * @param {number} applicationId - The ID of the application.
 * @param {number} functionInstanceId - The ID of the edge function instance.
 * @returns {Promise<object>} The updated rules engine rules.
 */
async function updateRulesEngine(applicationId, functionInstanceId) {
  const defaultRules = await ApplicationService.getRules(applicationId);
  const defaultRuleId = defaultRules.results[0].id;

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

/**
 * Builds an application from scratch, performing multiple steps.
 * @param {string} applicationName - The name of the application to be created.
 * @param {string} functionName - The name of the function to be instantiated.
 * @param {number} functionId - The ID of the function to be instantiated.
 * @returns {Promise<string>} The domain of the created application.
 */
async function buildFromScratch(applicationName, functionName, functionId) {
  try {
    let edgeApplication = await createApplication(applicationName);
    const applicationId = edgeApplication.results.id;
    edgeApplication = await enableEdgeFunctions(applicationId);

    const instantiate = await instantiateFunction(functionId, applicationId);
    const functionInstanceId = instantiate.results.id;

    await updateRulesEngine(applicationId, functionInstanceId);

    const domain = await createDomain(functionName, applicationId);
    const applicationDomain = domain.results.domain_name;

    return applicationDomain;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export default buildFromScratch;
