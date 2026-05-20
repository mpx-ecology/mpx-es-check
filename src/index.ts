#!/usr/bin/env node

import program from 'commander'
import pkg from '../package.json'
import runParseCode from './lib/index'

program
  .version(pkg.version)
  .arguments('[parseFiles...]')
  .option('-m, --module', 'a modular way to parse code', 'script')
  .option('-a, --all', 'check code use all rules: include instance method & static method', false)
  .option('-mini, --miniprogram', 'check miniprogram grammar', false)
  .option('-o, --output <output>', 'output path of result log (omit to skip file output)')
  .option('-e, --ecma <version>', 'version of rules applied', '')
  .action((parseFiles: string[], options: { module?: boolean | string; miniprogram?: boolean; ecma?: string; all?: boolean; output?: string }) => {
    const files = parseFiles.length ? parseFiles : []
    const esmodule = options.module
    const checkMiniprogram = options.miniprogram
    const version = options.ecma
    const useAllRules = options.all
    const output = options.output || null

    const rs = runParseCode({ version, esmodule: esmodule as boolean, files, useAllRules: useAllRules ?? false, output, checkMiniprogram })
    process.exitCode = rs.code
  })

program.parse(process.argv)
