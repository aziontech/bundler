#! /usr/bin/env node
import { Command } from 'commander';
import { satisfies } from 'semver';
import { executeCleanup, debug } from '#utils';
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
  process.on('exit', executeCleanup);
  process.on('SIGINT', () => {
    executeCleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    executeCleanup();
    process.exit(0);
  });
  process.on('SIGHUP', () => {
    executeCleanup();
    process.exit(0);
  });
  process.on('SIGBREAK', () => {
    executeCleanup();
    process.exit(0);
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    executeCleanup();
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    executeCleanup();
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

  // // Default to 'build' command when no command is provided
  // if (process.argv.length === 2) process.argv.push('build');

  AzionBundler.command('store <command>')
    .description('Manage store configuration')
    .option('-c, --config <json>', 'Configuration in JSON format (e.g., \'{"key": "value"}\')')
    .option('-s, --scope <scope>', 'Scope of the store (default: global)')
    .action(async (command, options) => {
      const { storeCommand } = await import('#commands');
      await storeCommand({
        command,
        options,
      });
    });

  AzionBundler.command('build')
    .description('Build your project for edge deployment')
    .option('-e, --entry <entries...>', 'Code entrypoint (default: ./main.js or ./main.ts)')
    .option('-p, --preset <type>', 'Preset of build target (e.g., vue, next, javascript)')
    .option(
      '--polyfills [boolean]',
      'Use node polyfills in build. Use --polyfills or --polyfills=true to enable, --polyfills=false to disable',
    )
    .option(
      '-w, --worker [boolean]',
      'Indicates that the constructed code inserts its own worker expression. Use --worker or --worker=true to enable, --worker=false to disable',
    )
    .option('-d, --dev', 'Build in development mode', false)
    .option('-x, --experimental [boolean]', 'Enable experimental features', false)
    .option('--skip-framework-build', 'Skip framework build step', false)
    .option('--only-generate-config', 'Build only generate azion.config', false)
    .addHelpText(
      'after',
      `
Examples:
  $ ef build -e ./src/index.js -p javascript
  $ ef build --only-generate-config -e index.js -p javascript
  $ ef build --preset opennextjs
  $ ef build --preset opennextjs --skip-framework-build
    `,
    )
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
    .description('Start local development environment')
    .argument('[entry]', 'Specify the entry file (default: .edge/worker.dev.js)')
    .option('-p, --port <port>', 'Specify the port', '3333')
    .option('-x, --experimental [boolean]', 'Enable experimental features', false)
    .option('--skip-framework-build', 'Skip framework build step', false)
    .option('--function-name <name>', 'Specify the function name')
    .action(async (entry, options) => {
      const { devCommand } = await import('#commands');

      const { experimental } = options;

      if (experimental) globalThis.bundler.experimental = true;

      await devCommand({ entry, ...options });
    });

  AzionBundler.command('presets <command>')
    .description('Manage presets for Azion projects')
    .argument('[preset]', 'Preset name (required for config command)')
    .action(async (command, preset) => {
      const { presetsCommand } = await import('#commands');
      await presetsCommand(command, { preset });
    });

  AzionBundler.command('manifest [action]')
    .description('Manage manifest files for Azion')
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
    .option('-k, --key <key...>', 'Property key (e.g., build.preset or edgeApplications[0].name)')
    .option('-v, --value <value...>', 'Value to be set')
    .option('-a, --all', 'Read or delete entire configuration (for read/delete commands)')
    .addHelpText(
      'after',
      `
Examples:
  $ ef config create -k "build.preset" -v "typescript"
  $ ef config read -a
  $ ef config read -k "build.preset"
  $ ef config update -k "build.preset" -v "vue"
  $ ef config delete -a
  $ ef config delete -k "build.preset"
  $ ef config replace -k '$EDGE_FUNCTION_NAME' -v "my-func"
    `,
    )
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
