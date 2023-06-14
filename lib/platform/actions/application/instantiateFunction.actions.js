import ApplicationService from '../../services/application.service.js';

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

export default instantiateFunction;
