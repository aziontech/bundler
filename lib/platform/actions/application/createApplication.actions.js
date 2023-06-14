import ApplicationService from '../../services/application.service.js';
/**
 * Creates a new application.
 * @param {string} applicationName - The name of the application to be created.
 * @returns {Promise<object>} The created application.
 */
async function createApplication(applicationName) {
  try {
    const payload = {
      name: applicationName,
      delivery_protocol: 'http,https',
    };
    const response = ApplicationService.create(payload);
    return response.results;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default createApplication;
