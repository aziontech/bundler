import { debug } from '#utils';
import { Platform } from '#namespaces';
import ApplicationService from '../../services/application.service.js';

/**
 * @function
 * @memberof Platform
 * @description Enables edge functions for the specified application.
 * @param {number} applicationId - The unique identifier of the application.
 * @returns {Promise<object>} A promise that resolves to the updated application
 * object with edge functions enabled.
 * @throws Will throw an error if the update process fails.
 * @example
 * try {
 *    const updatedApp = await enableEdgeFunctions(12345);
 *    console.log(updatedApp);
 * } catch (error) {
 *    console.error(error);
 * }
 */
async function enableEdgeFunctions(applicationId) {
  try {
    const payload = {
      edge_functions: true,
    };

    const response = await (
      await ApplicationService.update(applicationId, payload)
    ).json();
    return response.results;
  } catch (error) {
    debug.error(error);
    throw error;
  }
}

export default enableEdgeFunctions;
