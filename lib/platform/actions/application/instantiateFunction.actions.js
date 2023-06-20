import { feedback } from '#utils';
import ApplicationService from '../../services/application.service.js';

/**
 * Instantiates an edge function in an application.
 *  @param {string} functionName - The Name of the function to be instantiated.
 * @param {number} functionId - The ID of the function to be instantiated.
 * @param {number} applicationId - The ID of the application.
 * @returns {Promise<object>} The instantiated edge function.
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
    feedback.error(error);
    throw error;
  }
}

export default instantiateFunction;
