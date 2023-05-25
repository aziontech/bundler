#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

program.version('1.0.0');

program
    .command('command <arg>')
    .description('description')
    .action((arg) => {
        console.log(arg);
    });

program.parse(process.argv);
