#! /usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';

import { server } from '#env';

// temp/example
import { UnknownError } from '#errors';

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
    .command('run')
    .description('Run Edge Function')
    .option('-p, --port <port>', 'Specify the port', '3000')
    .option('-f, --file <filePath>', 'Specify the file path', path.join(process.cwd(), 'index.js'))
    .action(({ port, file }) => {
      const parsedPort = parseInt(port, 10);
      server(file, parsedPort);
    });

  program.parse(process.argv);
};

try {
  run();
} catch (err) {
  console.error(chalk.red('An error occurred:'), err);
}
