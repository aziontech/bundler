#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';

// temp/example
import { UnknownError } from '#errors';

import BuildDispatcher from '#buildDispatcher';

const version = process.env.npm_package_version;
const program = new Command();

const run = () => {
  program.version(version);
  program
    .command('command <arg>')
    .description('description')
    .action((arg) => {
      if (arg !== 'Smaug') {
        // temp/example
        throw new UnknownError('path/to/non-directory/resource');
      }
    });

  program
    .command('build')
    .description('build command')
    .option('--version-id <string>', 'build version id')
    .option('--target <string>', 'target to build', 'js')
    .option('--entry <string>', 'code entrypoint', 'index.js')
    .action(async (args) => {
      const { target, entry, versionId } = args;

      const buildDispatcher = new BuildDispatcher(target, entry, versionId);

      await buildDispatcher.run();
    });

  program.parse(process.argv);
};

try {
  run();
} catch (err) {
  console.error(chalk.red('An error occurred:'), err);
}
