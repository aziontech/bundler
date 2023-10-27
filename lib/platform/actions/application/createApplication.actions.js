import { debug } from '#utils';
import { Platform } from '#namespaces';
import ApplicationService from '../../services/application.service.js';

/**
 * @function
 * @memberof Platform
 * @description Creates a new application using the specified application name.
 * @param {string} applicationName - The name of the new application.
 * @returns {Promise<object>} A promise that resolves to the newly created application object.
 * @throws Will throw an error if the creation process fails.
 * @example
 * try {
 *    const newApp = await createApplication('My New Application');
 *    console.log(newApp);
 * } catch (error) {
 *    console.error(error);
 * }
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
