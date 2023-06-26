import { debug } from '#utils';
import ApplicationService from '../../services/application.service.js';
/**
 * Creates a new application.
 * @param {string} applicationName - The name of the function to be created.
 * @returns {Promise<object>} The created application.
 */
async function createApplication(applicationName) {
  try {
    const payload = {
      name: applicationName,
      delivery_protocol: 'http,https',
    };
    const response = await (await ApplicationService.create(payload)).json();
    return response.results;
  } catch (error) {
    debug.error(error);
    throw error;
  }
}

export default createApplication;
