import DomainService from '../../services/domain.service.js';

/**
 * Creates a domain for an application.
 * @param {string} domainName - The name of the domain to be created.
 * @param {number} applicationId - The ID of the application.
 * @returns {Promise<object>} The created domain.
 */
async function createDomain(domainName, applicationId) {
  const payload = {
    name: domainName,
    cname_access_only: false,
    digital_certificate_id: null,
    edge_application_id: applicationId,
    is_active: true,
  };

  return DomainService.create(payload);
}

export default createDomain;
