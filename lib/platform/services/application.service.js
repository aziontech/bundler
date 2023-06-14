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
   *                          Must contain the following properties:
   *                          - name (string): The name of the application.
   *                          - delivery_protocol (string): The delivery
   * protocol for the application.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  create(payload) {
    return super.post('', JSON.stringify(payload));
  }

  /**
   * Update an application.
   * @param {string} id - The ID of the application to update.
   * @param {object} payload - The payload for updating the application.
   *                          Must contain the properties to be updated.
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
   *                          Must contain the following properties:
   *                          - edge_function_id (number): The ID of the
   * edge function to be instantiated.
   *                          - args (object): Additional arguments for the function instance.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  instantiate(applicationId, payload) {
    return super.post(`/${applicationId}/functions_instances`, JSON.stringify(payload));
  }

  /**
   * Create a rule for an application.
   * @param {string} applicationId - The ID of the application.
   * @param {object} payload - The payload for creating the rule.
   *                          Must contain the properties for creating the rule.
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
   *                          Must contain the properties to be updated.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  updateRule(applicationId, ruleId, payload) {
    return super.patch(`/${applicationId}/rules_engine/request/rules/${ruleId}`, JSON.stringify(payload));
  }
}

// Singleton pattern
export default new ApplicationService();
