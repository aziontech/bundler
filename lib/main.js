#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';

// temp/example
import { UnknownError } from '#error';

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

  program.parse(process.argv);
};

try {
  run();
} catch (err) {
  console.error(chalk.red('An error occurred:'), err);
}
