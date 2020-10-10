#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk')
const pkg = require('../package.json')
const runParseCode = require('../lib/index')

const log = console.log

program
  .version(pkg.version)
  .arguments('[ecmaVersion] [parseFiles...]')
  .option('-m, --module', 'parse code by module type', true)
  .action((ecmaVersion, parseFiles, options) => {
    let version, esmodule, files, e
    version = ecmaVersion || 'es5'
    files = parseFiles.length? parseFiles : []
    esmodule = options.module

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
      default:
        log(chalk.red('Invalid ecmaScript version'))
        process.exit(1)
    }
    runParseCode(e, esmodule, files)
  })

program.parse(process.argv)
