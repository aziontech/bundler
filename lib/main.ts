#! /usr/bin/env node
import { Command } from 'commander';
import { satisfies } from 'semver';
import { removeAzionTempFiles, debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { BUNDLER } from '#constants';
import { createHash } from 'crypto';
import { mkdir } from 'fs/promises';
import type { BundlerGlobals } from '#types';

const AzionBundler = new Command();

/**
 * Generates a unique hash for the current project
 */
function generateProjectID(): string {
  const projectPath = process.cwd();
  return createHash('md5').update(projectPath).digest('hex');
}

/**
 * Creates and returns the path to the project's temporary folder
 */
async function createSessionTempDir(): Promise<string> {
  const projectID = generateProjectID();
  const tempPath = BUNDLER.TEMP_DIR(projectID);
  await mkdir(tempPath, { recursive: true });
  return tempPath;
}

/**
 * Validates if user is using the minimum Node version
 */
function validateNodeMinVersion(): boolean {
  const isAValidVersion = satisfies(process.version, `>= ${BUNDLER.MIN_NODE_VERSION}`);
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
async function getBundlerEnvironment(): Promise<BundlerGlobals> {
  const bundlerContext: BundlerGlobals = {
    root: BUNDLER.ROOT_PATH,
    package: BUNDLER.PACKAGE_JSON,
    debug: BUNDLER.IS_DEBUG,
    version: BUNDLER.VERSION,
    tempPath: await createSessionTempDir(),
    argsPath: BUNDLER.ARGS_PATH,
    experimental: BUNDLER.EXPERIMENTAL,
  };

  return bundlerContext;
}

/**
 * Sets up event handlers for cleanup and error handling.
 */
function setupBundlerProcessHandlers() {
  process.on('exit', removeAzionTempFiles);
  process.on('SIGINT', () => {
    removeAzionTempFiles();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    removeAzionTempFiles();
    process.exit(0);
  });
  process.on('SIGHUP', () => {
    removeAzionTempFiles();
    process.exit(0);
  });
  process.on('SIGBREAK', () => {
    removeAzionTempFiles();
    process.exit(0);
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    removeAzionTempFiles();
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    removeAzionTempFiles();
    process.exit(1);
  });
}

/**
 * Starts the command-line interface AzionBundler.
 * @example
 *    startBundler();
 */
function startBundler() {
  AzionBundler.version(globalThis.bundler.version);

  // Default to 'build' command when no command is provided
  if (process.argv.length === 2) process.argv.push('build');

  AzionBundler.command('store <command>')
    .description(
      'Manage local store. Commands:\n' +
        '  init    - Initialize or create a new store configuration\n' +
        '  update  - Update existing resources by name or add new ones if not found\n' +
        '  destroy - Remove the store configuration',
    )
    .option(
      '--config <json>',
      'Configuration in JSON format (e.g., \'{"edgeFunctions": [{"name": "my-function", "path": "/path"}]}\')',
    )
    .option('--scope <scope>', 'Scope of the store (default: global)')
    .action(async (command, options) => {
      const { storeCommand } = await import('#commands');
      await storeCommand({
        command,
        options,
      });
    });

  AzionBundler.command('build')
    .description('Build a project for edge deployment')
    .option('--entry <entries...>', 'Code entrypoint (default: ./main.js or ./main.ts)')
    .option('--preset <type>', 'Preset of build target (e.g., vue, next, javascript)')
    .option(
      '--polyfills [boolean]',
      'Use node polyfills in build. Use --polyfills or --polyfills=true to enable, --polyfills=false to disable',
    )
    .option(
      '--worker [boolean]',
      'Indicates that the constructed code inserts its own worker expression. Use --worker or --worker=true to enable, --worker=false to disable',
    )
    .option('--dev', 'Build in development mode', false)
    .option('--experimental [boolean]', 'Enable experimental features', false)
    .action(async (options) => {
      const { buildCommand, manifestCommand } = await import('#commands');
      const { dev, experimental, ...buildOptions } = options;

      if (experimental) globalThis.bundler.experimental = true;

      const { config } = await buildCommand({
        ...buildOptions,
        production: !dev,
      });

      await manifestCommand({ action: 'generate', config });
    });

  AzionBundler.command('dev')
    .description('Start local environment')
    .argument('[entry]', 'Specify the entry file (default: .edge/worker.dev.js)')
    .option('-p, --port <port>', 'Specify the port', '3333')
    .option('--experimental [boolean]', 'Enable experimental features', false)
    .action(async (entry, options) => {
      const { devCommand } = await import('#commands');

      const { experimental } = options;

      if (experimental) globalThis.bundler.experimental = true;

      await devCommand({ entry, ...options });
    });

  AzionBundler.command('presets <command>')
    .description('List <ls> defined project presets for Azion')
    .action(async (command) => {
      const { presetsCommand } = await import('#commands');
      await presetsCommand(command);
    });

  AzionBundler.command('manifest [action]')
    .description('Manage manifest files for Azion. Available actions: transform, generate')
    .argument(
      '[action]',
      'Action to perform: "transform" (JSON to JS) or "generate" (config to manifest)',
      'generate',
    )
    .option('-e, --entry <path>', 'Path to the input file or configuration file')
    .option('-o, --output <path>', 'Output file/directory path')
    .addHelpText(
      'after',
      `
Examples:
  $ ef manifest transform -e manifest.json -o azion.config.js
  $ ef manifest generate -e azion.config.js -o .edge
  $ ef manifest -e azion.config.js -o .edge
    `,
    )
    .action(async (action, options) => {
      const { manifestCommand } = await import('#commands');
      await manifestCommand({
        ...options,
        action,
      });
    });

  AzionBundler.command('config <command>')
    .description('Manage azion.config settings')
    .option('-k, --key <key>', 'Property key (e.g., build.preset or edgeApplications[0].name)')
    .option('-v, --value <value>', 'Value to be set')
    .action(async (command, options) => {
      const { configCommand } = await import('#commands');
      await configCommand({
        command,
        options,
      });
    });

  AzionBundler.parse(process.argv);
}

try {
  if (validateNodeMinVersion()) {
    globalThis.bundler = await getBundlerEnvironment();
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
