import createApplication from '../application/createApplication.actions.js';
import instantiateFunction from '../application/instantiateFunction.actions.js';
import enableEdgeFunctions from '../application/enableEdgeFunctions.actions.js';
import setFunctionAsDefaultRule from '../application/setFunctionAsDefaultRule.actions.js';
import createDomain from '../domain/createDomain.actions.js';
import createFunction from '../function/createFunction.actions.js';

/**
 * Create an application from scratch, performing multiple steps.
 * @param {string} applicationName - The name of the application to be created.
 * @param {string} functionName - The name of the function to be instantiated.
 * @returns {Promise<string>} The domain of the created application.
 */
async function deploy(applicationName, functionName) {
  try {
    const edgeFunctionId = (await createFunction()).id;
    const edgeApplicationId = (await createApplication(applicationName)).id;
    await enableEdgeFunctions(edgeApplicationId);

    const functionInstanceId = (await instantiateFunction(edgeFunctionId, edgeApplicationId)).id;
    await setFunctionAsDefaultRule(edgeApplicationId, functionInstanceId);

    const domain = (await createDomain(functionName, edgeApplicationId)).domain_name;

    return domain;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export default deploy;
