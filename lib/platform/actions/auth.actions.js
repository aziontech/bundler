import { vulcan } from '#env';
import TokensService from '../services/tokens.service.js';
import FunctionService from '../services/function.service.js';

/**
 * Authenticate the user with the provided credentials.
 * @param {string} loginOption - The login option chosen by the user.
 * Valid values are 'username/password' and 'token'.
 * @param {object} credentials - The user credentials required for authentication.
 * @param {string} [credentials.username] - The username for password-based authentication.
 * @param {string} [credentials.password] - The password for password-based authentication.
 * @param {string} [credentials.token] - The personal token for token-based authentication.
 * @returns {void}
 */
async function auth(loginOption, credentials) {
  try {
    if (loginOption === 'password') {
      const response = await TokensService.create(credentials.username, credentials.password);
      const responseJSON = await response.json();

      if (!responseJSON.token) {
        console.error(responseJSON);
      }
      if (responseJSON.token) {
        await vulcan.createVulcanEnv('API_TOKEN', responseJSON.token);
        console.log('API authentication token saved successfully!');
      }
    }
    if (loginOption === 'token') {
      await vulcan.createVulcanEnv('API_TOKEN', credentials.token);
      const validateTokenJSON = await (await FunctionService.getAll()).json();
      if (validateTokenJSON.results) {
        console.log('API authentication token saved successfully!');
      }
      if (!validateTokenJSON.results) {
        throw new Error(JSON.stringify(validateTokenJSON));
      }
    }
  } catch (error) {
    console.log('Authentication failed. Please check your credentials and try again.');
    console.error(error);
  }
}

export default auth;
