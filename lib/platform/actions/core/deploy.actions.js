import { feedback, generateTimestamp, debug } from '#utils';
import { Messages } from '#constants';

import createApplication from '../application/createApplication.actions.js';

import instantiateFunction from '../application/instantiateFunction.actions.js';
import enableEdgeFunctions from '../application/enableEdgeFunctions.actions.js';
import setFunctionAsDefaultRule from '../application/setFunctionAsDefaultRule.actions.js';
import createDomain from '../domain/createDomain.actions.js';
import createFunction from '../function/createFunction.actions.js';

/**
 * @function
 * @memberof Platform
 * @name deploy
 * @description Creates a new application from scratch, performing several steps including
 * function creation, application creation, enabling edge functions, function instantiation,
 * rule setting, and domain creation. If names are not provided, they will be auto-generated
 * using a timestamp.
 * @param {string} [applicationName] - The name of the application to be created. If not provided,
 * it will be auto-generated as `vulcan-${generateTimestamp()}`.
 * @param {string} [functionName] - The name of the function to be instantiated. If not provided,
 * it will be auto-generated as `vulcan-${generateTimestamp()}`.
 * @param {string} [domainName] - The name of the domain to be created. If not provided, it will be
 * auto-generated as `vulcan-${generateTimestamp()}`.
 * @returns {Promise<string>} A promise that resolves to the domain of the newly
 * created application.
 * @throws Will throw an error if any step in the deployment process fails.
 * @example
 * try {
 *    const domain = await deploy('myApplication', 'myFunction', 'myDomain');
 *    console.log('Domain of the new application:', domain);
 * } catch (error) {
 *    console.error(error);
 * }
 */
async function deploy(applicationName, functionName, domainName) {
  try {
    const timestamp = generateTimestamp();
    const deployId = `vulcan-${timestamp}`;

    feedback.platform.interactive.await(`[%d/6] - ${Messages.platform.deploy.info.creating_edge_function}`, 1);
    const generatedFunctionName = functionName || deployId;
    const edgeFunctionId = (await createFunction(generatedFunctionName)).id;

    feedback.platform.interactive.await(`[%d/6] - ${Messages.platform.deploy.info.creating_edge_application}`, 2);
    const generatedApplicationName = applicationName || deployId;
    const edgeApplicationId = (await createApplication(generatedApplicationName)).id;

    feedback.platform.interactive.await(`[%d/6] - ${Messages.platform.deploy.info.activating_edge_function}`, 3);
    await enableEdgeFunctions(edgeApplicationId);

    feedback.platform.interactive.await(`[%d/6] - ${Messages.platform.deploy.info.instantiating_edge_function}`, 4);
    const functionInstanceId = (await
    instantiateFunction(generatedFunctionName, edgeFunctionId, edgeApplicationId)).id;

    feedback.platform.interactive.await(`[%d/6] - ${Messages.platform.deploy.info.creating_rule_engine}`, 5);
    await setFunctionAsDefaultRule(edgeApplicationId, functionInstanceId);

    feedback.platform.interactive.await(`[%d/6] - ${Messages.platform.deploy.info.creating_domain}`, 6);
    const generatedDomainName = domainName || deployId;
    const domain = (await createDomain(generatedDomainName, edgeApplicationId)).domain_name;
    feedback.platform.interactive.complete(Messages.platform.deploy.success.deploy_finished);
    feedback.platform.interactive.breakInteractiveChain();

    return domain;
  } catch (error) {
    feedback.platform.error(Messages.platform.deploy.error.deploy_failed);
    debug.error(error);
    throw error;
  }
}
export default deploy;
