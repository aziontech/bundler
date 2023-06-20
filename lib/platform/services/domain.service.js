import BaseService from './base.service.js';

/**
 * Class representing the Domain Service.
 * @augments BaseService
 */
class DomainService extends BaseService {
  /**
   * Create an instance of the DomainService.
   */
  constructor() {
    super('/domains');
  }

  /**
   * Get all domains.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  getAll() {
    return super.get();
  }

  /**
   * Get a domain by ID.
   * @param {string} id - The ID of the domain.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  getById(id) {
    return super.get(`/${id}`);
  }

  /**
   * Create a new domain.
   * @param {object} payload - The payload for creating the domain.
   * @param {string} payload.name - The name of the domain.
   * @param {boolean} payload.cname_access_only - Whether the domain should
   * be accessed only via CNAME.
   * @param {number|null} payload.digital_certificate_id - The ID of the digital certificate
   * to be associated with the domain.
   * @param {number} payload.edge_application_id - The ID of the edge application
   * to which the domain belongs.
   * @param {boolean} payload.is_active - Whether the domain is active.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  create(payload) {
    return super.post('', JSON.stringify(payload));
  }
}

/**
 * Instance of the Domain Service.
 * This instance provides methods to interact with the Azion Domain API,
 * such as retrieving domains, getting domain details, and creating new domains.
 * @type {DomainService}
 * @function DomainService.getAll
 * @function DomainService.getById
 * @function DomainService.create
 * @example
 *
 * // Example usage
 * const payload = {
 *   name: 'example.com',
 *   cname_access_only: true,
 *   digital_certificate_id: 12345,
 *   edge_application_id: 67890,
 *   is_active: true
 * };
 *
 * DomainService.create(payload)
 *   .then((response) => {
 *     console.log(response);
 *   })
 *   .catch((error) => {
 *     feedback.error(error);
 *   });
 */
const DomainServiceInstance = new DomainService();

export default DomainServiceInstance;
