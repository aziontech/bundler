#! /usr/bin/env node
import { Command } from 'commander';
import { createPromptModule } from 'inquirer';
import chalk from 'chalk';
import path from 'path';

const version = process.env.npm_package_version;
const program = new Command();
const prompt = createPromptModule();

/**
 * Sets the global Vulcan environment.
 *
 * Validates the ENV value and sets it as the environment in the global 'vulcan' object.
 * If the ENV value is invalid, it throws an error and terminates the process.
 * @throws {Error} If ENV is not one of 'production', 'stage', 'dev'.
 * @example
 *    setVulcanEnvironment();
 */
function setVulcanEnvironment() {
  const ENV = process.env.AZION_ENV || 'production';
  if (!['production', 'stage', 'local'].includes(ENV)) {
    console.error(chalk.red('Invalid environment. Please set ENV to either production, stage, or local.'));
    process.exit(1);
  } else {
    globalThis.vulcan = { env: ENV };
  }
}

/**
 * Starts the command-line interface program.
 * @example
 *    startProgram();
 */
function startVulcanProgram() {
  program
    .version(version);

  program
    .command('auth')
    .option('--password <username>:<password>', 'Authenticate using username and password')
    .option('--token <token>', 'Authenticate using personal token')
    .description('Authenticate the CLI')
    .action(async (options) => {
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
    });

  program
    .command('run')
    .description('Run Edge Function')
    .option('-p, --port <port>', 'Specify the port', '3000')
    .option('-f, --file <filePath>', 'Specify the file path', path.join(process.cwd(), 'index.js'))
    .action(async (options) => {
      const { port, file } = options;
      const parsedPort = parseInt(port, 10);
      const { server } = await import('#env');
      server(file, parsedPort);
    });

  program
    .command('logs <type> [id]')
    .description('Perform operations on function or application logs')
    .option('-w, --watch', 'Show real-time logs')
    .action(async (type, id, options) => {
      const { functions } = await import('#platform');
      const { watch } = options;

      if (!['function', 'application'].includes(type)) {
        console.log('Invalid log type. Please specify either "function" or "application".');
        return;
      }

      if (type === 'function') { functions.actions.showFunctionLogs(id, watch); }
      if (type === 'application') { console.log('Logs for applications are not yet supported. Please specify "function" instead.'); }
    });
  program
    .command('build')
    .description('Build a project for edge deployment')
    .option('--preset <type>', 'Preset of build target (e.g., vue, next, js)', 'js')
    .option('--mode <type>', 'Mode of build target (e.g., static, server)', 'server')
    .option('--entry <string>', 'Code entrypoint (default: ./main.js)', './main.js')
    .action(async ({
      preset, mode, entry, versionId,
    }) => {
      const BuildDispatcher = (await import('#build')).default;
      const buildDispatcher = new BuildDispatcher(preset, mode, entry, versionId);
      await buildDispatcher.run();
    });

  program
    .command('storage sync')
    .description('Synchronize local /dist with the Edge Function storage')
    .action(async () => {
      const { core } = await import('#platform');
      const { getAzionVersionId } = await import('#utils');

      const versionId = getAzionVersionId();
      const basePath = path.join(process.cwd(), '/dist');

      try {
        await core.actions.uploadStatics(versionId, basePath);
        console.log(chalk.rgb(255, 136, 0)('🚀 Azion Upload succeeded!'));
      } catch (error) {
        console.error(chalk.red('An error occurred during upload:', error));
      }
    });

  program
    .command('publish')
    .description('Publish your project in the edge.')
    .action(async () => {
      const { core, functions } = await import('#platform');
      const { getAzionVersionId } = await import('#utils');

      const versionId = getAzionVersionId();
      const staticsPath = path.join(process.cwd(), '/.edge/statics');

      try {
        await core.actions.uploadStatics(versionId, staticsPath);
        console.log(chalk.rgb(255, 136, 0)('🚀 Static assets successfully uploaded to Edge!'));

        await functions.actions.publishFunction(); // TODO
        console.log(chalk.rgb(255, 136, 0)('🚀 Worker successfully uploaded to Edge!'));
      } catch (error) {
        console.error(chalk.red('An error occurred during upload:', error));
      }
    });

  program.parse(process.argv);
}

try {
  setVulcanEnvironment();
  startVulcanProgram();
} catch (err) {
  console.error(chalk.red('An error occurred:'), err);
}
