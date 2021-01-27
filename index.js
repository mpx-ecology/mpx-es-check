#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const pkg = require('./package.json')
const runParseCode = require('./lib/index')

const log = console.log

program
  .version(pkg.version)
  .arguments('[parseFiles...]')
  .option('-m, --module', 'a modular way to parse code', 'script')
  .option('-a, --all', 'check code use all rules: include instance method & static method', false)
  .option('-o, --output <output>', 'output path of result log', 'es-check.log')
  .option('-e, --ecma <version>', 'version of rules applied', 6)
  .action((parseFiles, options) => {
    const files = parseFiles.length ? parseFiles : []
    const esmodule = options.module
    const version = options.ecma
    const useAllRules = options.all
    const output = options.output

    const rs = runParseCode({ version, esmodule, files, useAllRules, output })
    if (rs.code !== 0) {
      log(chalk.red(rs.msg))
      process.exitCode = rs.code
    } else {
      log(chalk.green(rs.msg))
    }
  })

program.parse(process.argv)
