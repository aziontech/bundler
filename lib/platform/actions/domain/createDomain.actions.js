import { debug } from '#utils';
import DomainService from '../../services/domain.service.js';

/**
 * @function
 * @memberof platform
 * @name createDomain
 * @description Creates a new domain for a specific application. This operation requires
 * both the name for the new domain and the ID of the application to which it will be linked.
 * @param {string} domainName - The name of the domain to be created.
 * @param {number} applicationId - The ID of the application to which the new domain will be linked.
 * @returns {Promise<object>} A promise that resolves with the created domain's details.
 * The object returned contains details such as the ID, name, associated
 * edge application ID, and other properties.
 * @throws Will throw an error if the domain creation fails.
 * @example
 * try {
 *    const domainDetails = await createDomain('example.com', 1234);
 *    console.log(`Domain created with ID: ${domainDetails.id}`);
 * } catch (error) {
 *    console.error('Failed to create domain:', error);
 * }
 */
async function createDomain(domainName, applicationId) {
  try {
    const payload = {
      name: domainName,
      cname_access_only: false,
      digital_certificate_id: null,
      edge_application_id: applicationId,
      is_active: true,
    };

    const response = await (await DomainService.create(payload)).json();
    return response.results;
  } catch (error) {
    debug.error(error);
    throw error;
  }
}

export default createDomain;
