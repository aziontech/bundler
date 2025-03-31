#! /usr/bin/env node
import { join } from 'path';
import { Command } from 'commander';
import { satisfies } from 'semver';
import crypto from 'crypto';
import { FILE_PATTERNS, BUNDLER } from '#constants';
import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { readdir, unlink, mkdir } from 'fs/promises';

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
async function createSessionTempDir() {
  const projectID = generateProjectID();
  const tempPath = BUNDLER.TEMP_DIR(projectID);
  await mkdir(tempPath, { recursive: true });
  return tempPath;
}

/**
 * Validates if user is using the minimum Node version
 */
function validateNodeMinVersion() {
  const isAValidVersion = satisfies(
    process.version,
    `>= ${BUNDLER.MIN_NODE_VERSION}`,
  );
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
async function setBundlerEnvironment() {
  const bundlerContext = {
    root: BUNDLER.ROOT_PATH,
    package: BUNDLER.PACKAGE_JSON,
    debug: BUNDLER.IS_DEBUG,
    version: BUNDLER.VERSION,
    tempPath: await createSessionTempDir(),
    argsPath: BUNDLER.ARGS_PATH,
  };

  globalThis.bundler = bundlerContext;
}

/**
 * Removes all temporary files starting with 'azion-' and ending with '.temp.js' or '.temp.ts'.
 */
async function cleanUpTempFiles() {
  const directory = process.cwd();
  const tempFiles = await readdir(directory);
  const filteredFiles = tempFiles.filter(
    (file) =>
      file.startsWith(FILE_PATTERNS.TEMP_PREFIX) &&
      file.includes(FILE_PATTERNS.TEMP_SUFFIX),
  );

  await Promise.all(
    filteredFiles.map(async (file) => {
      const filePath = join(directory, file);
      await unlink(filePath);
    }),
  );
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
  AzionBundler.version(BUNDLER.VERSION);

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
      '--entry <entries...>',
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
      console.log(options.entry, 'entrieeeess');
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
  $ ef manifest transform --entry=manifest.json --output=azion.config.js
  $ ef manifest generate --entry=azion.config.js --output=.edge
  $ ef manifest --entry=azion.config.js --output=.edge
    `,
    )
    .action(async (action, options) => {
      const { manifestCommand } = await import('#commands');
      await manifestCommand({
        ...options,
        action,
      });
    });

  AzionBundler.parse(process.argv);
}

try {
  if (validateNodeMinVersion()) {
    await setBundlerEnvironment();
    startBundler();
    setupBundlerProcessHandlers();
  }
  if (!validateNodeMinVersion()) {
    feedback.error(
      `Invalid Node version. Node version must be greater than ${BUNDLER.MIN_NODE_VERSION}.`,
    );
    process.exit(1);
  }
} catch (error) {
  feedback.error('An unknown error occurred.');
  debug.error(error);
  process.exit(1);
}
