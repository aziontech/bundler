#! /usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';

const version = process.env.npm_package_version;
const program = new Command();

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
    console.error(chalk.red('Invalid environment. Please set ENV to either production, stage, or local.'));
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
  program
    .version(version);

  program
    .command('run')
    .description('Run Edge Function')
    .option('-p, --port <port>', 'Specify the port', '3000')
    .option('-f, --file <filePath>', 'Specify the file path', path.join(process.cwd(), 'index.js'))
    .action(async (args) => {
      const parsedPort = parseInt(args.port, 10);
      const { server } = await import('#env');
      server(args.file, parsedPort);
    });

  program
    .command('logs <type> [id]')
    .description('Perform operations on function or application logs')
    .option('-w, --watch', 'Show real-time logs')
    .action(async (type, id, options) => {
      const { functions } = await import('#platform');
      const { watch } = options;

      if (type !== 'functions' && type !== 'applications') {
        console.log('Invalid log type. Please specify either "functions" or "applications".');
        return;
      }

      if (type === 'functions') { functions.actions.showFunctionsLogs(id, watch); }
      if (type === 'applications') { console.log('Logs for applications are not yet supported. Please specify "functions" instead.'); }
    });

  program.parse(process.argv);
}

try {
  setVulcanEnvironment();
  startVulcanProgram();
} catch (err) {
  console.error(chalk.red('An error occurred:'), err);
}
