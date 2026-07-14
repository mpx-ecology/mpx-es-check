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
  .option('-t, --target <target>', 'target environment (e.g. es5, es2015, hermes, drn)', '')
  .option('-i, --ignore <pattern>', 'glob pattern of files to exclude (repeatable)', (val: string, acc: string[]) => acc.concat(val), [] as string[])
  .option('--ignore-source <pattern>', 'source file or npm package to ignore after sourcemap mapping (repeatable)', (val: string, acc: string[]) => acc.concat(val), [] as string[])
  .option('--no-ignore-polyfills', 'disable automatic ignoring of problems from polyfill libraries (core-js, @babel/runtime, etc.)')
  .option('--allow-syntax <items>', 'comma-separated list of nodeTypes or message substrings to whitelist (e.g. ArrowFunctionExpression,Map.groupBy)', (val: string) => val.split(',').map(s => s.trim()).filter(Boolean), [] as string[])
  .action((parseFiles: string[], options: { module?: boolean | string; miniprogram?: boolean; target?: string; all?: boolean; output?: string; ignore?: string[]; ignoreSource?: string[]; ignorePolyfills?: boolean; allowSyntax?: string[] }) => {
    const files = parseFiles.length ? parseFiles : []
    const esmodule = options.module
    const checkMiniprogram = options.miniprogram
    const useAllRules = options.all
    const output = options.output || null
    const ignore = options.ignore ?? []
    const ignoreSource = options.ignoreSource ?? []
    const target = options.target || ''
    const ignorePolyfills = options.ignorePolyfills !== false
    const allowSyntax = options.allowSyntax ?? []

    const rs = runParseCode({ target, esmodule: esmodule as boolean, files, ignore, ignoreSource, useAllRules: useAllRules ?? false, output, checkMiniprogram, ignorePolyfills, allowSyntax })
    process.exitCode = rs.code
  })

program.parse(process.argv)
