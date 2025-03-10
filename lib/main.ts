#! /usr/bin/env node
import { resolve, join } from 'path';
import { readFileSync, readdirSync, unlinkSync, mkdirSync } from 'fs';
import { Command } from 'commander';
import { satisfies } from 'semver';
import { feedback, getAbsoluteDirPath } from 'azion/utils/node';
import { debug } from '#utils';
import { Messages } from '#constants';
import os from 'os';
import crypto from 'crypto';

const MIN_NODE_VERSION = '18.0.0';

const bundlerLibPath = getAbsoluteDirPath(import.meta.url, 'bundler');

const bundlerRootPath = resolve(bundlerLibPath, '.');
const bundlerPackageJSON = JSON.parse(
  readFileSync(`${bundlerRootPath}/package.json`, 'utf8'),
);
const bundlerVersion = bundlerPackageJSON.version;

const debugEnabled = process.env.DEBUG === 'true';

const program = new Command();

/**
 * Generates a unique hash for the current project
 */
function generateProjectHash() {
  const projectPath = process.cwd();
  return crypto.createHash('md5').update(projectPath).digest('hex');
}

/**
 * Creates and returns the path to the project's temporary folder
 */
function createProjectTempPath() {
  const projectHash = generateProjectHash();
  const tempPath = join(os.tmpdir(), '.azion', projectHash);
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
interface BundlerGlobals {
  root: string;
  package: Record<string, unknown>;
  debug: boolean;
  version: string;
  tempPath: string;
  argsPath: string;
}

declare global {
  var bundler: BundlerGlobals;
}

function setBundlerEnvironment() {
  const bundlerContext = {
    root: bundlerRootPath,
    package: bundlerPackageJSON,
    debug: debugEnabled,
    version: bundlerVersion,
    tempPath: createProjectTempPath(),
    argsPath: `azion/args.json`,
  };

  globalThis.bundler = bundlerContext;
}

/**
 * Removes all temporary files starting with 'bundler-' and ending with '.temp.js'.
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
 * Starts the command-line interface program.
 * @example
 *    startBundlerProgram();
 */
function startBundlerProgram() {
  program.version(bundlerVersion);

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
    .option('--development', 'Build in development mode', false)
    .action(async (options) => {
      const { buildCommand } = await import('#commands');
      await buildCommand({
        ...options,
        production: !options.development,
      });
    });

  program
    .command('dev')
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

  program
    .command('presets <command>')
    .description('List <ls> defined project presets for Azion')
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
      await manifestCommand(command, entry, options);
    });

  program.parse(process.argv);
}

try {
  if (validateNodeMinVersion()) {
    setBundlerEnvironment();
    startBundlerProgram();
    setupBundlerProcessHandlers();
  }
  if (!validateNodeMinVersion()) {
    feedback.error(Messages.errors.invalid_node_version(MIN_NODE_VERSION));
    process.exit(1);
  }
} catch (error) {
  feedback.error(Messages.errors.unknown_error);
  (debug as any).error(error);
  process.exit(1);
}
