import BaseService from './base.service.js';

/**
 * Service class for managing tokens.
 * Extends the BaseService class.
 */
class TokensService extends BaseService {
  /**
   * Constructs an instance of TokensService.
   * Initializes the base URL for tokens.
   */
  constructor() {
    super('/tokens');
  }

  /**
   * Creates a new token.
   * @param {string} username - The username for authentication.
   * @param {string} password - The password for authentication.
   * @returns {Promise} A promise that resolves to the created token.
   */
  create(username, password) {
    const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return super.post('', '', {
      headers: {
        Authorization: `Basic ${base64Credentials}`,
      },
    });
  }
}

/**
 * @name TokensService
 * @memberof Services
 * Instance of the Tokens Service.
 * This instance provides methods to interact with Azion's Tokens service,
 * such as creating a new token for authentication.
 * @type {BaseService}
 * @function create
 * @example
 *
 * // Example usage
 * const username = 'myUsername';
 * const password = 'myPassword';
 *
 * TokensService.create(username, password)
 *   .then((token) => {
 *     console.log(token);
 *   })
 *   .catch((error) => {
 *     feedback.error(error);
 *   });
 */
const TokensServiceInstance = new TokensService();
export default TokensServiceInstance;
