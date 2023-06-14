import ApplicationService from '../../services/application.service.js';
/**
 * Enables edge functions in an application.
 * @param {number} applicationId - The ID of the application.
 * @returns {Promise<object>} The updated application with edge functions enabled.
 */
async function enableEdgeFunctions(applicationId) {
  const payload = {
    edge_functions: true,
  };
  return ApplicationService.update(applicationId, payload);
}

export default enableEdgeFunctions;
