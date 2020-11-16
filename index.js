#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const pkg = require('./package.json')
const runParseCode = require('./lib/index')

// const ecmaVersion = ''
const log = console.log

program
  .version(pkg.version)
  .arguments('[ecmaVersion] [parseFiles...]')
  .option('-m, --module', 'a modular way to parse code', 'script')
  .option('-a, --all', 'check code use all rules: include instance method & static method', false)
  .option('-e, --ecma <version>', 'check code use all rules: include instance method & static method', 6)
  .action((ecmaVersion, parseFiles, options) => {
    let e
    const files = parseFiles.length ? parseFiles : []
    const esmodule = options.module
    let version = options.ecma || ecmaVersion || 'es6'
    const useAllRules = options.all

    if (!version) {
      log(chalk.red('No ecmaScript version'))
      process.exit(1)
    }

    switch (version) {
      case 'es3':
        e = '3'
        break
      case 'es4':
        e = '4'
        break
      case 'es5':
        e = '5'
        break
      case 'es6':
        e = '6'
        break
      case 'es7':
        e = '7'
        break
      case 'es8':
        e = '8'
        break
      case 'es9':
        e = '9'
        break
      case 'es10':
        e = '10'
        break
      case 'es11':
        e = '11'
        break
      case 'es12':
        e = '12'
        break
      case '3':
        e = '3'
        break
      case '4':
        e = '4'
        break
      case '5':
        e = '5'
        break
      case '6':
        e = '6'
        break
      case '7':
        e = '7'
        break
      case '8':
        e = '8'
        break
      case '9':
        e = '9'
        break
      case '10':
        e = '10'
        break
      case '11':
        e = '11'
        break
      case '12':
        e = '12'
        break
      case 'es2015':
        e = '6'
        break
      case 'es2016':
        e = '7'
        break
      case 'es2017':
        e = '8'
        break
      case 'es2018':
        e = '9'
        break
      case 'es2019':
        e = '10'
        break
      case 'es2020':
        e = '11'
        break
      case 'es2021':
        e = '12'
        break
      default:
        log(chalk.red('Invalid ecmaScript version'))
        process.exit(1)
    }
    runParseCode(e, esmodule, files, useAllRules)
  })

program.parse(process.argv)
