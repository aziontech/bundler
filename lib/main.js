#! /usr/bin/env node
import path from 'path';
import { Command } from 'commander';
import { createPromptModule } from 'inquirer';
import { satisfies } from 'semver';
import { feedback, debug } from '#utils';
import { Messages } from '#constants';

const MIN_NODE_VERSION = '18.0.0';

const debugEnabled = process.env.DEBUG === 'true';
const version = process.env.npm_package_version;
const program = new Command();
const prompt = createPromptModule();

/**
 * Validates if user is using the minimum Node version
 * @returns {boolean} - indicates if is a valid version
 */
function validateNodeMinVersion() {
  const isAValidVersion = satisfies(process.version, `>= ${MIN_NODE_VERSION}`);

  return isAValidVersion;
}

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
    feedback.error(Messages.env.errors.invalid_environment);
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
  program.version(version);

  if (debugEnabled) {
    program
      .command('auth')
      .option(
        '--password <username>:<password>',
        'Authenticate using username and password',
      )
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
      .command('logs <type> [id]')
      .description('Perform operations on function or application logs')
      .option('-w, --watch', 'Show real-time logs')
      .action(async (type, id, options) => {
        const { functions } = await import('#platform');
        const { watch } = options;

        if (!['function', 'application'].includes(type)) {
          feedback.error(Messages.platform.logs.errors.invalid_log_type);
          return;
        }

        if (type === 'function') {
          functions.actions.showFunctionLogs(id, watch);
        }
        if (type === 'application') {
          feedback.info(Messages.platform.logs.info.unsupported_log_type);
        }
      });

    program
      .command('storage sync')
      .description(
        'Synchronize local .edge/statics with the Edge Function storage',
      )
      .action(async () => {
        const { core } = await import('#platform');
        const { getVulcanBuildId } = await import('#utils');

        const versionId = getVulcanBuildId();
        const basePath = path.join(process.cwd(), '.edge/statics/');
        await core.actions.uploadStatics(versionId, basePath);
      });

    program
      .command('deploy')
      .description('Create and deploy an application with a function')
      .action(async () => {
        const { core } = await import('#platform');
        const { getVulcanBuildId } = await import('#utils');

        const versionId = getVulcanBuildId();
        const staticsPath = path.join(process.cwd(), '/.edge/statics');

        const answers = await prompt([
          {
            type: 'input',
            name: 'applicationName',
            message:
              'Enter the name of the application (optional, leave empty for random name):',
          },
          {
            type: 'input',
            name: 'functionName',
            message:
              'Enter the name of the function (optional, leave empty for random name):',
          },
        ]);

        const { applicationName, functionName } = answers;

        await core.actions.uploadStatics(versionId, staticsPath);
        const domain = await core.actions.deploy(applicationName, functionName);
        core.actions.watchPropagation(domain);
      });
  }

  program
    .command('build')
    .description('Build a project for edge deployment')
    .option(
      '--preset <type>',
      'Preset of build target (e.g., vue, next, javascript)',
      'javascript',
    )
    .option(
      '--mode <type>',
      'Mode of build target (e.g., deliver, compute)',
      'compute',
    )
    .option(
      '--entry <string>',
      'Code entrypoint (default: ./main.js)',
      './main.js',
    )
    .action(async ({
      preset, mode, entry, versionId,
    }) => {
      // TODO: generate versionID in dispatcher (currently generated for webpackconfig)
      const BuildDispatcher = (await import('#build')).default;
      const buildDispatcher = new BuildDispatcher(
        preset,
        mode,
        entry,
        versionId,
      );
      await buildDispatcher.run();
    });

  program
    .command('run')
    .description('Run Edge Function')
    .arguments('[file]')
    .option('-p, --port <port>', 'Specify the port', '3000')
    .action(async (file, options) => {
      const { port } = options;
      const parsedPort = parseInt(port, 10);
      const { server } = await import('#env');
      const entryPoint = file || path.join(process.cwd(), '.edge/worker.js');
      server(entryPoint, parsedPort);
    });

  program
    .command('presets <type>')
    .description('Create or use defined project presets for Edge.')
    .action(async (type) => {
      const { getPresetsList } = await import('#utils');
      const presets = getPresetsList();

      if (type === 'ls') {
        presets.forEach((preset) => feedback.option(preset));
      }
    });
  program.parse(process.argv);
}

try {
  if (validateNodeMinVersion()) {
    setVulcanEnvironment();
    startVulcanProgram();
  } else {
    feedback.error(Messages.errors.invalid_node_version(MIN_NODE_VERSION));
  }
} catch (error) {
  feedback.error(Messages.errors.unknown_error);
  debug.error(error);
}
