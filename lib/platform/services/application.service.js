import BaseService from './base.service.js';

/**
 * Class representing the Application Service.
 * @augments BaseService
 */
class ApplicationService extends BaseService {
  /**
   * Create an instance of the ApplicationService.
   */
  constructor() {
    super('/edge_applications');
  }

  /**
   * Get all applications.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  getAll() {
    return super.get();
  }

  /**
   * Get an application by ID.
   * @param {string} id - The ID of the application.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  getById(id) {
    return super.get(`/${id}`);
  }

  /**
   * Create a new application.
   * @param {object} payload - The payload for creating the application.
   * @param {string} payload.name - The name of the application.
   * @param {string} payload.delivery_protocol - The delivery protocol for the application.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  create(payload) {
    return super.post('', JSON.stringify(payload));
  }

  /**
   * Update an application.
   * @param {string} id - The ID of the application to update.
   * @param {object} payload - The payload for updating the application.
   * @param {string} payload.name - The updated name of the application.
   * @param {string} payload.delivery_protocol - The updated delivery protocol for the application.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  update(id, payload) {
    return super.patch(`/${id}`, JSON.stringify(payload));
  }

  /**
   * Delete an application.
   * @param {string} id - The ID of the application to delete.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  delete(id) {
    return super.delete(`/${id}`);
  }

  /**
   * Instantiate a function instance for an application.
   * @param {string} applicationId - The ID of the application.
   * @param {object} payload - The payload for instantiating the function instance.
   * @param {number} payload.edge_function_id - The ID of the edge function to be instantiated.
   * @param {object} payload.args - Additional arguments for the function instance.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  instantiate(applicationId, payload) {
    return super.post(`/${applicationId}/functions_instances`, JSON.stringify(payload));
  }

  /**
   * Create a rule for an application.
   * @param {string} applicationId - The ID of the application.
   * @param {object} payload - The payload for creating the rule.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  createRule(applicationId, payload) {
    return super.post(`/${applicationId}/rules_engine/request/rules`, JSON.stringify(payload));
  }

  /**
   * Update a rule for an application.
   * @param {string} applicationId - The ID of the application.
   * @param {string} ruleId - The ID of the rule to update.
   * @param {object} payload - The payload for updating the rule.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  updateRule(applicationId, ruleId, payload) {
    return super.patch(`/${applicationId}/rules_engine/request/rules/${ruleId}`, JSON.stringify(payload));
  }

  /**
   * Get an application rules.
   * @param {string} applicationId - The ID of the application to get rules.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  getRules(applicationId) {
    return super.get(`/${applicationId}/rules_engine/request/rules`);
  }
}

/**
 * Instance of the Application Service.
 * This instance provides methods to interact with Azion's Application service,
 * such as creating, updating, and deleting applications, as well as retrieving application details.
 * @type {BaseService}
 * @function create
 * @function update
 * @function getAll
 * @function getById
 * @function delete
 * @function instantiate
 * @function createRule
 * @function updateRule
 * @function getRules
 * @example
 *
 * // Example usage
 * const payload = {
 *   name: "My Application",
 *   delivery_protocol: "http,https"
 * };
 *
 * ApplicationService.create(payload)
 *   .then((response) => {
 *     console.log(response);
 *   })
 *   .catch((error) => {
 *     console.error(error);
 *   });
 */
const ApplicationServiceInstance = new ApplicationService();
export default ApplicationServiceInstance;
