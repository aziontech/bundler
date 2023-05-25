#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";

const program = new Command();

const run = () => {
  program.version("1.0.0");
  program
    .command("command <arg>")
    .description("description")
    .action((arg) => {
      console.log(arg);
    });

  program.parse(process.argv);
};

try {
  run();
} catch (err) {
  console.error(chalk.red("An error occurred:"), err);
}
