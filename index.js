#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const pkg = require('./package.json')
const runParseCode = require('./lib/index')
const { versionMap } = require('./lib/constant')

const log = console.log

program
  .version(pkg.version)
  .arguments('[parseFiles...]')
  .option('-m, --module', 'a modular way to parse code', 'script')
  .option('-a, --all', 'check code use all rules: include instance method & static method', false)
  .option('-e, --ecma <version>', 'check code use all rules: include instance method & static method', 6)
  .action((parseFiles, options) => {
    const files = parseFiles.length ? parseFiles : []

    const esmodule = options.module
    const rawVersion = options.ecma || 'es6'
    const useAllRules = options.all

    const version = versionMap[rawVersion]

    if (!version) {
      log(chalk.red('Invalid ecmaScript version'))
      process.exit(1)
    }

    runParseCode(version, esmodule, files, useAllRules)
  })

program.parse(process.argv)
