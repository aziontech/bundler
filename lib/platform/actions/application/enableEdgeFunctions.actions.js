import ApplicationService from '../../services/application.service.js';
/**
 * Enables edge functions in an application.
 * @param {number} applicationId - The ID of the application.
 * @returns {Promise<object>} The updated application with edge functions enabled.
 */
async function enableEdgeFunctions(applicationId) {
  try {
    const payload = {
      edge_functions: true,
    };

    const response = await (await ApplicationService.update(applicationId, payload)).json();
    return response.results;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default enableEdgeFunctions;
