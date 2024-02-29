import { createPromptModule } from 'inquirer';

import { Commands } from '#namespaces';

const prompt = createPromptModule();
/**
 * @function
 * @memberof Commands
 * @description A command to handle authentication through various methods.
 * @param {object} options - Configuration options for authentication
 * @param {string} [options.password] - Credentials in the format "username:password"
 * @param {string} [options.token] - Personal authentication token
 * @returns {Promise<void>} - A promise that resolves when authentication is complete
 * @example
 *
 * authCommand({
 *   password: 'username:password'
 * });
 *
 * authCommand({
 *   token: 'your_personal_token'
 * });
 *
 * authCommand({});
 */
async function authCommand(options) {
  const { core } = await import('#platform');

  const authOptions = [
    {
      name: 'Username and Password',
      value: 'password',
    },
    {
      name: 'Personal Token',
      value: 'token',
    },
  ];

  if (options.password) {
    const [username, password] = options.password.split(':');
    core.actions.auth('password', { username, password });
  }

  if (options.token) {
    const { token } = options;
    core.actions.auth('token', { token });
  }

  if (!options.token && !options.password) {
    const { authOption } = await prompt([
      {
        type: 'list',
        name: 'authOption',
        message: 'Choose your login option:',
        choices: authOptions.map((option) => option.name),
      },
    ]);

    if (authOption === 'Username and Password') {
      const { username, password } = await prompt([
        {
          type: 'input',
          name: 'username',
          message: 'Enter your username:',
        },
        {
          type: 'password',
          name: 'password',
          message: 'Enter your password:',
        },
      ]);
      core.actions.auth('password', { username, password });
    }
    if (authOption === 'Personal Token') {
      const { token } = await prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Enter your personal token:',
        },
      ]);
      core.actions.auth('token', { token });
    }
  }
}

export default authCommand;
