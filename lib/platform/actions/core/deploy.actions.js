import chalk from 'chalk';
import { generateTimestamp } from '#utils';

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
    const deployId = `vulcan-${generateTimestamp()}`;

    const generatedFunctionName = functionName || deployId;
    const edgeFunctionId = (await createFunction(generatedFunctionName)).id;
    console.log(chalk.rgb(255, 136, 0)('🚀 Worker successfully uploaded to Edge!'));

    const generatedApplicationName = applicationName || deployId;
    const edgeApplicationId = (await createApplication(generatedApplicationName)).id;
    await enableEdgeFunctions(edgeApplicationId);

    const functionInstanceId = (await
    instantiateFunction(generatedFunctionName, edgeFunctionId, edgeApplicationId)).id;

    await setFunctionAsDefaultRule(edgeApplicationId, functionInstanceId);

    const generatedDomainName = domainName || deployId;
    const domain = (await createDomain(generatedDomainName, edgeApplicationId)).domain_name;
    console.log(chalk.green(`Application deployed successfully. Domain: ${domain}`));

    return domain;
  } catch (error) {
    console.error(chalk.red('An error occurred during deployment:'), error);
    throw error;
  }
}
export default deploy;
