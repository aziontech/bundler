import ApplicationService from '../../services/application.service.js';
/**
 * Creates a new application.
 * @param {string} applicationName - The name of the application to be created.
 * @returns {Promise<object>} The created application.
 */
async function createApplication(applicationName) {
  const payload = {
    name: applicationName,
    delivery_protocol: 'http,https',
  };
  return ApplicationService.create(payload);
}

export default createApplication;
