import { feedback, debug } from '#utils';
import DomainService from '../../services/domain.service.js';

/**
 * Creates a domain for an application.
 * @param {string} domainName - The name of the domain to be created.
 * @param {number} applicationId - The ID of the application.
 * @returns {Promise<object>} The created domain.
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
