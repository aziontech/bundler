#! /usr/bin/env node
import { resolve, join } from 'path';
import { readFileSync, readdirSync, unlinkSync, mkdirSync } from 'fs';
import { Command } from 'commander';
import { satisfies } from 'semver';
import { feedback, debug, getAbsoluteLibDirPath } from '#utils';
import { Messages } from '#constants';
import os from 'os';
import crypto from 'crypto';

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
 * Generates a unique hash for the current project
 * @returns {string} MD5 hash of the project path
 */
function generateProjectHash() {
  const projectPath = process.cwd();
  return crypto.createHash('md5').update(projectPath).digest('hex');
}

/**
 * Creates and returns the path to the project's temporary folder
 * @returns {string} Path to the project's temporary folder
 */
function createProjectTempPath() {
  const projectHash = generateProjectHash();
  const tempPath = join(os.tmpdir(), '.azion', projectHash);
  mkdirSync(tempPath, { recursive: true });
  return tempPath;
}

/**
 * Validates if user is using the minimum Node version
 * @returns {boolean} - indicates if is a valid version
 */
function validateNodeMinVersion() {
  const isAValidVersion = satisfies(process.version, `>= ${MIN_NODE_VERSION}`);
  return isAValidVersion;
}

/**
 * Converts object keys from kebab-case to camelCase.
 * @param {object} options - The original object with kebab-case keys.
 * @returns {object} A new object with the same properties, but keys in camelCase.
 * @example
 * const originalOptions = { 'polyfills': true, 'only-manifest': false };
 * const convertedOptions = convertOptions(originalOptions);
 * // Result: { polyfills: true, onlyManifest: false }
 */
function convertOptions(options) {
  return Object.entries(options).reduce((acc, [key, value]) => {
    const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    // Handle boolean flags
    acc[camelKey] = value === '' ? true : value;
    return acc;
  }, {});
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
    buildProd: true,
    tempPath: createProjectTempPath(),
    argsPath: `azion/args.json`,
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
    (file) => file.startsWith('azion-') && file.endsWith('.temp.js'),
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
    .option('--preset <preset_name>', 'Preset name', false)
    .option('--scope <scope>', 'project scope', 'global')
    .description('Initialize temporary store')
    .action(async (options) => {
      const { initCommand } = await import('#commands');
      await initCommand(options);
    });

  program
    .command('build')
    .description('Build a project for edge deployment')
    .option(
      '--entry <string>',
      'Code entrypoint (default: ./main.js or ./main.ts)',
    )
    .option(
      '--preset <type>',
      'Preset of build target (e.g., vue, next, javascript)',
    )
    .option(
      '--polyfills [boolean]',
      'Use node polyfills in build. Use --polyfills or --polyfills=true to enable, --polyfills=false to disable',
    )
    .option(
      '--worker [boolean]',
      'Indicates that the constructed code inserts its own worker expression. Use --worker or --worker=true to enable, --worker=false to disable',
    )
    .option(
      '--firewall',
      'To enable the firewall (Experimental) for local environment',
      false,
    )
    .action(async (options) => {
      const { buildCommand } = await import('#commands');
      globalThis.vulcan.buildProd = true;
      const convertedOptions = convertOptions(options);
      await buildCommand(convertedOptions, convertedOptions.firewall);
    });

  program
    .command('dev')
    .description('Start local environment')
    .argument(
      '[entry]',
      'Specify the entry file (default: .edge/worker.dev.js)',
    )
    .option('-p, --port <port>', 'Specify the port', '3333')
    .option(
      '--firewall',
      'To enable the firewall (Experimental) for local environment (default: false)',
      false,
    )
    .action(async (entry, options) => {
      globalThis.vulcan.buildProd = false;
      const { devCommand } = await import('#commands');
      const convertedOptions = convertOptions(options);
      await devCommand(entry, convertedOptions);
    });

  program
    .command('presets <command>')
    .description(
      'Create <create> or list <ls> defined project presets for Azion',
    )
    .action(async (command) => {
      const { presetsCommand } = await import('#commands');
      await presetsCommand(command);
    });

  program
    .command('manifest <command>')
    .description(
      'Trasnform <transform> or validate <validate> manifest files for Azion',
    )
    .argument('[entry]', 'Path to the input file')
    .option('-o, --output <path>', 'Output file path for convert command')
    .action(async (command, entry, options) => {
      const { manifestCommand } = await import('#commands');
      await manifestCommand(command, entry, convertOptions(options));
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
