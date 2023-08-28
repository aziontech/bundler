#! /usr/bin/env node
import { join, resolve } from 'path';
import { readFileSync } from 'fs';
import { Command } from 'commander';
import { createPromptModule } from 'inquirer';
import { satisfies } from 'semver';
import {
  feedback, debug, getAbsoluteLibDirPath,
} from '#utils';
import { Messages, FrameworkInitializer } from '#constants';

const MIN_NODE_VERSION = '18.0.0';

const vulcanLibPath = getAbsoluteLibDirPath();
const vulcanRootPath = resolve(vulcanLibPath, '..');
const vulcanPackageJSON = JSON.parse(readFileSync(`${vulcanRootPath}/package.json`, 'utf8'));
const vulcanVersion = vulcanPackageJSON.version;

const debugEnabled = process.env.DEBUG === 'true';

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
  const vulcanContext = {
    env: 'production',
    root: vulcanRootPath,
    package: vulcanPackageJSON,
    debug: debugEnabled,
    version: vulcanVersion,
  };

  const AZION_ENV = process.env.AZION_ENV || vulcanContext.env;
  if (!['production', 'stage', 'local'].includes(AZION_ENV)) {
    feedback.error(Messages.env.errors.invalid_environment);
    process.exit(1);
  } else {
    vulcanContext.env = AZION_ENV;
  }
  globalThis.vulcan = vulcanContext;
}
/**
 * Starts the command-line interface program.
 * @example
 *    startVulcanProgram();
 */
function startVulcanProgram() {
  program.version(vulcanVersion);

  program
    .command('init')
    .option('--name <project_name>', 'Project name')
    .description('Initialize a new project')
    .action(async (options) => {
      const AVALIABLE_TEMPLATES = Object.keys(FrameworkInitializer);
      let projectName = options.name;

      const { frameworkChoice } = await prompt([
        {
          type: 'list',
          name: 'frameworkChoice',
          message: 'Choose a template for your project:',
          choices: AVALIABLE_TEMPLATES,
        },
      ]);

      while (!projectName) {
      // eslint-disable-next-line no-await-in-loop
        const { projectName: inputName } = await prompt([
          {
            type: 'input',
            name: 'projectName',
            message: 'Enter your project name:',
          },
        ]);

        if (inputName) {
          projectName = inputName;
        }
        if (!inputName) {
          feedback.pending(Messages.info.name_required);
        }
      }

      const createFrameworkTemplate = FrameworkInitializer[frameworkChoice];

      if (createFrameworkTemplate) {
        await createFrameworkTemplate(projectName);
      } else {
        feedback.error(Messages.errors.invalid_choice);
      }
    });

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
    .option(
      '--useNodePolyfills',
      'Use node polyfills in build.',
    )
    .action(async ({
      preset, mode, entry, useNodePolyfills,
    }) => {
      let entryPoint = false;

      if (preset === 'javascript') {
        entryPoint = entry;
        feedback.info('Using main.js as entrypoint by default');
      }
      if (preset === 'typescript') {
        if (entry) { entryPoint = entry; }
        if (!entry) {
          feedback.info('Using main.ts as entrypoint by default');
          entryPoint = './main.ts';
        }
      }

      const BuildDispatcher = (await import('#build')).default;
      const buildDispatcher = new BuildDispatcher(
        preset,
        mode,
        entryPoint,
        useNodePolyfills,
      );
      await buildDispatcher.run();
    });

  program
    .command('dev')
    .description('Start local environment')
    .arguments('[file]')
    .option('-p, --port <port>', 'Specify the port', '3000')
    .action(async (file, options) => {
      const { port } = options;
      const parsedPort = parseInt(port, 10);
      const { server } = await import('#env');
      const entryPoint = file || join(process.cwd(), '.edge/worker.js');
      server(entryPoint, parsedPort);
    });

  program
    .command('presets <type>')
    .description('Create or use defined project presets for Edge')
    .action(async (type) => {
      const { presets } = await import('#utils');

      let name;
      let mode;

      switch (type) {
        case 'create':
          // eslint-disable-next-line no-constant-condition
          while (true) {
            // eslint-disable-next-line no-await-in-loop
            const { inputPresetName } = await prompt([
              {
                type: 'input',
                name: 'inputPresetName',
                message: 'Enter the preset name:',
              },
            ]);

            const presetExists = presets
              .getKeys()
              .map((existingPresetName) => existingPresetName.toLowerCase())
              .includes(inputPresetName.toLowerCase());

            if (presetExists) {
              feedback.error('A preset with this name already exists.');
            } else if (!inputPresetName) {
              feedback.error('Preset name cannot be empty.');
            } else {
              name = inputPresetName;
              break;
            }
          }

          // eslint-disable-next-line no-constant-condition
          while (true) {
            // eslint-disable-next-line no-await-in-loop
            const { inputMode } = await prompt([
              {
                type: 'list',
                name: 'inputMode',
                message: 'Choose the mode:',
                choices: ['compute', 'deliver'],
              },
            ]);

            if (['compute', 'deliver'].includes(inputMode)) {
              mode = inputMode;
              break;
            } else {
              feedback.error('Invalid mode. Choose either "compute" or "deliver".');
            }
          }

          try {
            presets.set(name, mode);
            feedback.success(`${name}(${mode}) created with success!`);
            feedback.info(`Now open './lib/presets/${name}/${mode}' and work on your preset.`);
          } catch (error) {
            debug.error(error);
            feedback.error(Messages.errors.folder_creation_failed(name));
          }
          break;

        case 'ls':
          presets.getBeautify().forEach((preset) => feedback.option(preset));
          break;

        default:
          feedback.error('Invalid argument provided.');
          break;
      }
    });

  if (debugEnabled) {
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
      .command('storage sync')
      .description(
        'Synchronize local .edge/storage with the Edge Function storage',
      )
      .action(async () => {
        const { core } = await import('#platform');
        const { getVulcanBuildId } = await import('#utils');

        const versionId = getVulcanBuildId();
        const basePath = join(process.cwd(), '.edge/storage/');
        await core.actions.uploadStatics(versionId, basePath);
      });

    program
      .command('deploy')
      .description('Create and deploy an application with a function')
      .action(async () => {
        const { core } = await import('#platform');
        const { getVulcanBuildId } = await import('#utils');

        const versionId = getVulcanBuildId();
        const staticsPath = join(process.cwd(), '/.edge/storage');

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

  program.parse(process.argv);
}

try {
  if (validateNodeMinVersion()) {
    setVulcanEnvironment();
    startVulcanProgram();
  }
  if (!validateNodeMinVersion()) {
    feedback.error(Messages.errors.invalid_node_version(MIN_NODE_VERSION));
    process.exit(1);
  }
} catch (error) {
  feedback.error(Messages.errors.unknown_error);
  debug.error(error);
  process.exit(1);
}
