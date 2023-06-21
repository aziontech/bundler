import { feedback, generateTimestamp, debug } from '#utils';
import { Messages } from '#constants';

import createApplication from '../application/createApplication.actions.js';

import instantiateFunction from '../application/instantiateFunction.actions.js';
import enableEdgeFunctions from '../application/enableEdgeFunctions.actions.js';
import setFunctionAsDefaultRule from '../application/setFunctionAsDefaultRule.actions.js';
import createDomain from '../domain/createDomain.actions.js';
import createFunction from '../function/createFunction.actions.js';

/**
 * Create an application from scratch, performing multiple steps.
 * @param {string} applicationName - The name of the application to be created.
 *  If not provided, it will be generated as `vulcan-${generateTimestamp()}`.
 * @param {string} functionName - The name of the function to be instantiated.
 *  If not provided, it will be generated as `vulcan-${generateTimestamp()}`.
 * @param {string} domainName - The name of the domain to be created.
 *  If not provided, it will be generated as `vulcan-${generateTimestamp()}`.
 * @returns {Promise<string>} The domain of the created application.
 */
async function deploy(applicationName, functionName, domainName) {
  try {
    const timestamp = generateTimestamp();
    const deployId = `vulcan-${timestamp}`;

    feedback.platform.interactive.await(Messages.platform.deploy.info.creating_edge_function);
    const generatedFunctionName = functionName || deployId;
    const edgeFunctionId = (await createFunction(generatedFunctionName)).id;

    feedback.platform.interactive.await(Messages.platform.deploy.info.creating_edge_application);
    const generatedApplicationName = applicationName || deployId;
    const edgeApplicationId = (await createApplication(generatedApplicationName)).id;

    feedback.platform.interactive.await(Messages.platform.deploy.info.activating_edge_function);
    await enableEdgeFunctions(edgeApplicationId);

    feedback.platform.interactive.await(Messages.platform.deploy.info.instantiating_edge_function);
    const functionInstanceId = (await
    instantiateFunction(generatedFunctionName, edgeFunctionId, edgeApplicationId)).id;

    feedback.platform.interactive.await(Messages.platform.deploy.info.creating_rule_engine);
    await setFunctionAsDefaultRule(edgeApplicationId, functionInstanceId);

    feedback.platform.interactive.await(Messages.platform.deploy.info.creating_domain);
    const generatedDomainName = domainName || deployId;
    const domain = (await createDomain(generatedDomainName, edgeApplicationId)).domain_name;
    setTimeout(() => {
      feedback.platform.interactive.await(Messages.platform.deploy.success.deploy_finished);
    }, 300);
    return domain;
  } catch (error) {
    feedback.platform.error(Messages.platform.deploy.error.deploy_failed);
    debug.error(error);
    throw error;
  }
}
export default deploy;
