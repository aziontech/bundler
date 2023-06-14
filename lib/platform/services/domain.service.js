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
   *                          Must contain the following properties:
   *                          - name (string): The name of the domain.
   *                          - cname_access_only (boolean):
   * Whether the domain should be accessed only via CNAME.
   *                          - digital_certificate_id (number|null):
   * The ID of the digital certificate to be associated with the domain.
   *                          - edge_application_id (number): The ID of the edge application
   * to which the domain belongs.
   *                          - is_active (boolean): Whether the domain is active.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  create(payload) {
    return super.post('', JSON.stringify(payload));
  }
}

// Singleton pattern
export default new DomainService();
