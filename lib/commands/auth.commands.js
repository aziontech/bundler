import { createPromptModule } from 'inquirer';

const prompt = createPromptModule();
/**
 *
 * @param options
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
