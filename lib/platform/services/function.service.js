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
   * @param {object} payload - The payload for creating the function.
   * @param {string} payload.name - The name of the function.
   * @param {string} payload.code - The code of the function.
   * @param {string} payload.language - The language of the function.
   * @param {string} payload.initiator_type - The initiator type of the function.
   * @param {object} payload.json_args - The JSON arguments of the function.
   * @param {boolean} payload.active - The status of the function (active or inactive).
   * @returns {Promise} A Promise representing the result of the API call.
   */
  create(payload) {
    return super.post('', JSON.stringify(payload));
  }

  /**
   * Update a function by ID.
   * @param {string} id - The ID of the function.
   * @param {object} payload - The payload for updating the function.
   * @param {string} payload.name - The updated name of the function.
   * @param {string} payload.code - The updated code of the function.
   * @param {string} payload.language - The updated language of the function.
   * @param {string} payload.initiator_type - The updated initiator type of the function.
   * @param {object} payload.json_args - The updated JSON arguments of the function.
   * @param {boolean} payload.active - The updated status of the function (active or inactive).
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
/**
 * Instance of the Function Service.
 * This instance provides methods to interact with Azion's Function service,
 * such as creating, updating, and deleting functions, as well as retrieving function details.
 * @type {BaseService}
 * @function FunctionService.create
 * @function FunctionService.update
 * @function FunctionService.getAll
 * @function FunctionService.getById
 * @example
 * const functionService = new FunctionService();
 *
 * // Example usage
 *   const payload = {
      name: "Function One"
      code: "...",
      language: "javascript",
      initiator_type: "edge_application",
      json_args: {},
      active: true
    };
 *
 * functionService.create(payload)
 *   .then((response) => {
 *     console.log(response);
 *   })
 *   .catch((error) => {
 *     feedback.error(error);
 *   });
 */
const FunctionServiceInstance = new FunctionService();
export default FunctionServiceInstance;
