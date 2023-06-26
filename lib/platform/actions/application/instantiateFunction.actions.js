import { debug } from '#utils';
import ApplicationService from '../../services/application.service.js';

/**
 * @function
 * @memberof Platform
 * @name instantiateFunction
 * @description Instantiates an edge function in the specified application.
 * @param {string} functionName - The name of the function to be instantiated.
 * @param {number} functionId - The unique identifier of the function to be instantiated.
 * @param {number} applicationId - The unique identifier of the application.
 * @returns {Promise<object>} A promise that resolves to the instantiated edge function object.
 * @throws Will throw an error if the instantiation process fails.
 * @example
 * try {
 *    const instantiatedFunc = await instantiateFunction('My Function', 123, 456);
 *    console.log(instantiatedFunc);
 * } catch (error) {
 *    console.error(error);
 * }
 */
async function instantiateFunction(functionName, functionId, applicationId) {
  const payload = {
    name: functionName,
    edge_function_id: functionId,
    args: {},
  };
  try {
    const response = await (await ApplicationService.instantiate(applicationId, payload)).json();
    return response.results;
  } catch (error) {
    debug.error(error);
    throw error;
  }
}

export default instantiateFunction;
