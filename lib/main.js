#! /usr/bin/env node
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { Command } from 'commander';
import { satisfies } from 'semver';
import { feedback, debug, getAbsoluteLibDirPath } from '#utils';
import { Messages } from '#constants';

const MIN_NODE_VERSION = '18.0.0';

const vulcanLibPath = getAbsoluteLibDirPath();
const vulcanRootPath = resolve(vulcanLibPath, '..');
const vulcanPackageJSON = JSON.parse(
  readFileSync(`${vulcanRootPath}/package.json`, 'utf8'),
);
const vulcanVersion = vulcanPackageJSON.version;

const debugEnabled = process.env.DEBUG === 'true';

const program = new Command();

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
      const { initCommand } = await import('#commands');
      await initCommand(options);
    });

  program
    .command('build')
    .description('Build a project for edge deployment')
    .option('--entry <string>', 'Code entrypoint (default: ./main.js)')
    .option(
      '--preset <type>',
      'Preset of build target (e.g., vue, next, javascript)',
    )
    .option('--mode <type>', 'Mode of build target (e.g., deliver, compute)')
    .option('--useNodePolyfills', 'Use node polyfills in build.')
    .action(async (options) => {
      const { buildCommand } = await import('#commands');
      await buildCommand(options);
    });

  program
    .command('dev')
    .description('Start local environment')
    .arguments('[entry]')
    .option('-p, --port <port>', 'Specify the port', '3000')
    .action(async (entry, options) => {
      const { devCommand } = await import('#commands');
      await devCommand(entry, options);
    });

  program
    .command('presets <command>')
    .description(
      'Create <create> or list <ls> defined project presets for Edge',
    )
    .option(
      '--preset <name>',
      'Specify the name of the preset to list its modes',
    )
    .action(async (command, options) => {
      const { presetsCommand } = await import('#commands');
      await presetsCommand(command, options.preset);
    });

  if (debugEnabled) {
    program
      .command('logs <type> [id]')
      .description('Perform operations on function or application logs')
      .option('-w, --watch', 'Show real-time logs')
      .action(async (type, id, options) => {
        const { logsCommand } = await import('#commands');
        await logsCommand(type, id, options);
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
        const { authCommand } = await import('#commands');
        await authCommand(options);
      });

    program
      .command('storage sync')
      .description(
        'Synchronize local .edge/storage with the Edge Function storage',
      )
      .action(async () => {
        const { storageCommand } = await import('#commands');
        await storageCommand();
      });

    program
      .command('deploy')
      .description('Create and deploy an application with a function')
      .action(async () => {
        const { deployCommand } = await import('#commands');
        await deployCommand();
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
