import { vulcan } from '#env';
import { Messages } from '#constants';
import { feedback, debug } from '#utils';
import TokensService from '../../services/tokens.service.js';
import FunctionService from '../../services/function.service.js';

/**
 * @function
 * @memberof platform
 * @name auth
 * @description Authenticates the user with the provided credentials.
 * @param {string} loginOption - The chosen login method. Valid values are
 * 'username/password' and 'token'.
 * @param {object} credentials - The user credentials required for authentication.
 * @param {string} [credentials.username] - Required for 'username/password' option.
 *  Represents the username for password-based authentication.
 * @param {string} [credentials.password] - Required for 'username/password' option.
 * Represents the password for password-based authentication.
 * @param {string} [credentials.token] - Required for 'token' option.
 * Represents the personal token for token-based authentication.
 * @returns {void}
 * @throws Will throw an error if the authentication process fails.
 * @example
 * // For 'username/password' option
 * try {
 *    await auth('password', { username: 'exampleUser', password: 'examplePass' });
 * } catch (error) {
 *    console.error(error);
 * }
 * // For 'token' option
 * try {
 *    await auth('token', { token: 'exampleToken' });
 * } catch (error) {
 *    console.error(error);
 * }
 */
async function auth(loginOption, credentials) {
  try {
    if (loginOption === 'password') {
      const response = await TokensService.create(
        credentials.username,
        credentials.password,
      );
      const responseJSON = await response.json();

      if (!responseJSON.token) {
        feedback.error(responseJSON);
      }
      if (responseJSON.token) {
        await vulcan.createVulcanEnv(
          { API_TOKEN: credentials.token },
          'global',
        );
        feedback.success(Messages.platform.auth.success.auth_success);
      }
    }
    if (loginOption === 'token') {
      await vulcan.createVulcanEnv({ API_TOKEN: credentials.token }, 'global');
      const validateTokenJSON = await (await FunctionService.getAll()).json();
      if (validateTokenJSON.results) {
        feedback.success(Messages.platform.auth.success.auth_success);
      }
      if (!validateTokenJSON.results) {
        throw new Error(JSON.stringify(validateTokenJSON));
      }
    }
  } catch (error) {
    feedback.error(Messages.platform.auth.error.auth_failed);
    debug.error(error);
  }
}

export default auth;
