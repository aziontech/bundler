#! /usr/bin/env node
import { resolve, join } from 'path';
import { readFileSync, readdirSync, unlinkSync } from 'fs';
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
    // This global variable is to define whether the build is for prod or dev. This is to handle external modules.
    buildProd: true,
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
 * Removes all temporary files starting with 'vulcan-' and ending with '.temp.js'.
 */
function cleanUpTempFiles() {
  const directory = process.cwd();
  const tempFiles = readdirSync(directory).filter(
    (file) => file.startsWith('vulcan-') && file.endsWith('.temp.js'),
  );

  tempFiles.forEach((file) => {
    const filePath = join(directory, file);
    unlinkSync(filePath);
  });
}

/**
 * Sets up event handlers for cleanup and error handling.
 */
function setupVulcanProcessHandlers() {
  process.on('exit', cleanUpTempFiles);
  process.on('SIGINT', () => {
    cleanUpTempFiles();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanUpTempFiles();
    process.exit(0);
  });
  process.on('SIGHUP', () => {
    cleanUpTempFiles();
    process.exit(0);
  });
  process.on('SIGBREAK', () => {
    cleanUpTempFiles();
    process.exit(0);
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    cleanUpTempFiles();
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    cleanUpTempFiles();
    process.exit(1);
  });
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
    .option('--preset <preset_name>', 'Preset name', false)
    .option('--template <template_name>', 'Template name', false)
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
    .option('--useNodePolyfills <boolean>', 'Use node polyfills in build.')
    .option('--onlyManifest', 'Process just the azion.config.js')
    .option(
      '--useOwnWorker <boolean>',
      'This flag indicates that the constructed code inserts its own worker expression, such as addEventListener("fetch") or similar, without the need to inject a provider.',
    )
    .option(
      '--firewall',
      'To enable the firewall (Experimental) for local environment (default: false)',
      false,
    )
    .action(async (options) => {
      const { buildCommand } = await import('#commands');
      globalThis.vulcan.buildProd = true;
      await buildCommand(options, options?.firewall);
    });

  program
    .command('dev')
    .description('Start local environment')
    .arguments('[entry]')
    .option('-p, --port <port>', 'Specify the port', '3333')
    .option(
      '--firewall',
      'To enable the firewall (Experimental) for local environment (default: false)',
      false,
    )
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

  program.parse(process.argv);
}

try {
  if (validateNodeMinVersion()) {
    setVulcanEnvironment();
    startVulcanProgram();
    setupVulcanProcessHandlers();
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
