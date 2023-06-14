import createApplication from '../application/createApplication.actions.js';
import instantiateFunction from '../application/instantiateFunction.actions.js';
import enableEdgeFunctions from '../application/enableEdgeFunctions.actions.js';
import setFunctionAsDefaultRule from '../application/setFunctionAsDefaultRule.actions.js';
import createDomain from '../domain/createDomain.actions.js';

/**
 * Create an application from scratch, performing multiple steps.
 * @param {string} applicationName - The name of the application to be created.
 * @param {string} functionName - The name of the function to be instantiated.
 * @param {number} functionId - The ID of the function to be instantiated.
 * @returns {Promise<string>} The domain of the created application.
 */
async function deploy(applicationName, functionName, functionId) {
  try {
    let edgeApplication = await createApplication(applicationName);
    const applicationId = edgeApplication.results.id;
    edgeApplication = await enableEdgeFunctions(applicationId);

    const instantiate = await instantiateFunction(functionId, applicationId);
    const functionInstanceId = instantiate.results.id;

    await setFunctionAsDefaultRule(applicationId, functionInstanceId);

    const domain = await createDomain(functionName, applicationId);
    const applicationDomain = domain.results.domain_name;

    return applicationDomain;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export default deploy;
