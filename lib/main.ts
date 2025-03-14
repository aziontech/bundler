#! /usr/bin/env node
import { resolve, join } from 'path';
import { readFileSync, readdirSync, unlinkSync, mkdirSync } from 'fs';
import { Command } from 'commander';
import { satisfies } from 'semver';
import os from 'os';
import crypto from 'crypto';

import { debug } from '#utils';
import { feedback, getAbsoluteDirPath } from 'azion/utils/node';

const MIN_NODE_VERSION = '18.0.0';

const BUNDLER_LIB_DIR_ABSOLUTE_PATH = getAbsoluteDirPath(
  import.meta.url,
  'bundler',
);
const BUNDLER_ROOT_ABSOLUTE_PATH = resolve(BUNDLER_LIB_DIR_ABSOLUTE_PATH, '.');
const BUNDLER_PACKAGE_JSON = JSON.parse(
  readFileSync(`${BUNDLER_ROOT_ABSOLUTE_PATH}/package.json`, 'utf8'),
);
const BUNDLER_CURRENT_VERSION = BUNDLER_PACKAGE_JSON.version;
const IS_DEBUG_ENABLED = process.env.DEBUG === 'true';

const AzionBundler = new Command();

/**
 * Generates a unique hash for the current project
 */
function generateProjectID() {
  const projectPath = process.cwd();
  return crypto.createHash('md5').update(projectPath).digest('hex');
}

/**
 * Creates and returns the path to the project's temporary folder
 */
function createSessionTempDir() {
  const projectID = generateProjectID();
  const tempPath = join(os.tmpdir(), '.azion', projectID);
  mkdirSync(tempPath, { recursive: true });
  return tempPath;
}

/**
 * Validates if user is using the minimum Node version
 */
function validateNodeMinVersion() {
  const isAValidVersion = satisfies(process.version, `>= ${MIN_NODE_VERSION}`);
  return isAValidVersion;
}

/**
 * Sets the global Bundler environment.
 *
 * Validates the ENV value and sets it as the environment in the global 'bundler' object.
 * If the ENV value is invalid, it throws an error and terminates the process.
 * @example
 *    setBundlerEnvironment();
 */
function setBundlerEnvironment() {
  const bundlerContext = {
    root: BUNDLER_ROOT_ABSOLUTE_PATH,
    package: BUNDLER_PACKAGE_JSON,
    debug: IS_DEBUG_ENABLED,
    version: BUNDLER_CURRENT_VERSION,
    tempPath: createSessionTempDir(),
    argsPath: `azion/args.json`,
  };

  globalThis.bundler = bundlerContext;
}

/**
 * Removes all temporary files starting with 'azion-' and ending with '.temp.js' or '.temp.ts'.
 */
function cleanUpTempFiles() {
  const directory = process.cwd();
  const tempFiles = readdirSync(directory).filter(
    (file) =>
      file.startsWith('azion-') &&
      (file.endsWith('.temp.js') || file.endsWith('.temp.ts')),
  );

  tempFiles.forEach((file) => {
    const filePath = join(directory, file);
    unlinkSync(filePath);
  });
}

/**
 * Sets up event handlers for cleanup and error handling.
 */
function setupBundlerProcessHandlers() {
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
 * Starts the command-line interface AzionBundler.
 * @example
 *    startBundler();
 */
function startBundler() {
  AzionBundler.version(BUNDLER_CURRENT_VERSION);

  AzionBundler.command('store <command>')
    .description('Manage store configuration (init/destroy)')
    .option('--scope <scope>', 'Project scope', 'global')
    .option('--preset <string>', 'Preset name')
    .option('--entry <string>', 'Code entrypoint')
    .option('--bundler <type>', 'Bundler type (webpack/esbuild)')
    .option('--polyfills [boolean]', 'Use node polyfills in build')
    .option('--worker [boolean]', 'Indicates worker expression')
    .action(async (command, options) => {
      const { storeCommand } = await import('#commands');
      await storeCommand({ command, options });
    });

  AzionBundler.command('build')
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
    .option('--development', 'Build in development mode', false)
    .action(async (options) => {
      const { buildCommand, manifestCommand } = await import('#commands');
      const { config } = await buildCommand({
        ...options,
        production: !options.development,
      });

      await manifestCommand({ action: 'generate', config });
    });

  AzionBundler.command('dev')
    .description('Start local environment')
    .argument(
      '[entry]',
      'Specify the entry file (default: .edge/worker.dev.js)',
    )
    .option('-p, --port <port>', 'Specify the port', '3333')
    .action(async (entry, options) => {
      const { devCommand } = await import('#commands');
      await devCommand({ entry, ...options });
    });

  AzionBundler.command('presets <command>')
    .description('List <ls> defined project presets for Azion')
    .action(async (command) => {
      const { presetsCommand } = await import('#commands');
      await presetsCommand(command);
    });

  AzionBundler.command('manifest [action]')
    .description(
      'Manage manifest files for Azion. Available actions: transform, generate',
    )
    .argument(
      '[action]',
      'Action to perform: "transform" (JSON to JS) or "generate" (config to manifest)',
      'generate',
    )
    .option('--entry <path>', 'Path to the input file or configuration file')
    .option('--output <path>', 'Output file/directory path')
    .addHelpText(
      'after',
      `
Examples:
  $ az manifest transform --entry=manifest.json --output=azion.config.js
  $ az manifest generate --entry=azion.config.js --output=.edge
  $ az manifest --entry=azion.config.js --output=.edge
    `,
    )
    .action(async (action, options) => {
      const { manifestCommand } = await import('#commands');

      // Passar todas as opções diretamente com action em vez de command
      await manifestCommand({
        ...options,
        action,
      });
    });

  AzionBundler.parse(process.argv);
}

try {
  if (validateNodeMinVersion()) {
    setBundlerEnvironment();
    startBundler();
    setupBundlerProcessHandlers();
  }
  if (!validateNodeMinVersion()) {
    feedback.error(
      `Invalid Node version. Node version must be greater than ${MIN_NODE_VERSION}.`,
    );
    process.exit(1);
  }
} catch (error) {
  feedback.error('An unknown error occurred.');
  debug.error(error);
  process.exit(1);
}
