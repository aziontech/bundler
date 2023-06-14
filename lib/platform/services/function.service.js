import BaseService from './base.service.js';

/**
 * Class representing the Function Service.
 * @augments BaseService
 */
class FunctionService extends BaseService {
  /**
   * Create an instance of the FunctionService.
   */
  constructor() {
    super('/edge_functions');
  }

  /**
   * Get all functions.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  getAll() {
    return super.get();
  }

  /**
   * Get a function by ID.
   * @param {string} id - The ID of the function.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  getById(id) {
    return super.get(`/${id}`);
  }

  /**
   * Create a new function.
   * @param {object} payload - The payload containing the function data.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  create(payload) {
    return super.post('', JSON.stringify(payload));
  }

  /**
   * Update a function by ID.
   * @param {string} id - The ID of the function.
   * @param {object} payload - The payload containing the updated function data.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  update(id, payload) {
    return super.patch(`/${id}`, JSON.stringify(payload));
  }

  /**
   * Delete a function by ID.
   * @param {string} id - The ID of the function to delete.
   * @returns {Promise} A Promise representing the result of the API call.
   */
  delete(id) {
    return super.delete(`/${id}`);
  }
}

// Singleton pattern
export default new FunctionService();
