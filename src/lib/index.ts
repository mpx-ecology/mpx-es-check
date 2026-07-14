import * as parser from '@babel/parser'
import fs from 'fs'
import glob from 'glob'
import { Instance as ChalkInstance } from 'chalk'
import runRules from './check'
import { getLogOutputPath } from './util'
import { applySourceMap, formatProblems, formatProblemsPlain } from './format'
import collectRule from './collect-rule'
import type { Problem, Rule } from '../types'
import { POLYFILL_PATH_RE } from './polyfill-re'
import { isIgnoredSource } from './ignore-source'
import type { IgnoreSourcePattern } from './ignore-source'

const chalk = new ChalkInstance()

const acornBaseOpts = { ecmaVersion: 2050 as const, silent: true, locations: true }

interface ParseCodeOptions {
  target?: string
  esmodule?: boolean | string
  files: string[]
  ignore?: string[]
  useAllRules?: boolean
  output?: string | null
  checkMiniprogram?: boolean
  customRules?: Rule
  sourceMap?: string
  silent?: boolean
  ignorePolyfills?: boolean
  ignoreSource?: IgnoreSourcePattern[]
  allowSyntax?: string[]
  [key: string]: unknown
}

function getSourceMap (file: string): string | undefined {
  let sourceMapCode: string | undefined
  try {
    if (fs.existsSync(file + '.map')) {
      sourceMapCode = fs.readFileSync(file + '.map', 'utf-8')
    }
  } catch (e) {
    console.error('error reading sourcemap:', e)
  }
  return sourceMapCode
}

function createLogger (output: string): Console {
  const resultOutputPath = getLogOutputPath(output)
  try {
    fs.writeFileSync(resultOutputPath, '')
  } catch (e) {
    console.error('error creating log file:', e)
  }
  const stderr = fs.createWriteStream(resultOutputPath, {
    flags: 'a',
    encoding: 'utf-8'
  })
  return new console.Console(stderr)
}

function filterProblems (problems: Problem[], options: ParseCodeOptions): Problem[] {
  const ignorePolyfills = options.ignorePolyfills !== false
  const ignoreSource = options.ignoreSource ?? []
  const allowSyntax = options.allowSyntax ?? []
  return problems.filter(problem => {
    if (ignorePolyfills && problem.sourceFile && POLYFILL_PATH_RE.test(problem.sourceFile)) return false
    if (isIgnoredSource(problem.sourceFile || problem.file, ignoreSource)) return false
    if (allowSyntax.length && allowSyntax.some(s =>
      (problem.nodeType != null && problem.nodeType === s) ||
      problem.message.includes(s)
    )) return false
    return true
  })
}

function check (file: string, code: string, options: ParseCodeOptions): Problem[] {
  const {
    target,
    esmodule,
    useAllRules,
    checkMiniprogram,
    silent,
    output
  } = options

  const acornOpts = { ...acornBaseOpts, sourceType: esmodule ? ('module' as const) : ('script' as const) }
  const configuredRules = collectRule(target, useAllRules ?? false, options, checkMiniprogram)
  const ast = parser.parse(code, acornOpts)
  let problems = runRules({ ast: ast as unknown as import('../types').ASTNode }, configuredRules) || []
  if (problems.length) {
    problems.forEach(p => { p.file = file })
    applySourceMap(problems, options.sourceMap)
    problems = filterProblems(problems, options)
  }
  if (!silent && problems.length) {
    console.log(formatProblems(problems, chalk))
    if (output) {
      const logger = createLogger(output)
      logger.log(formatProblemsPlain(problems))
    }
  }
  return problems
}

function parseCode (options: ParseCodeOptions): { code: number } {
  const { files, ignore, useAllRules } = options

  const globOpts = { nodir: true, ignore: ignore ?? [] }
  let hasProblem = false

  files.forEach(pattern => {
    const globbedFiles = glob.sync(pattern, globOpts)

    if (globbedFiles.length === 0) {
      process.stderr.write(`No files matched the pattern: ${pattern}\n`)
      process.exit(1)
    }
    globbedFiles.forEach(file => {
      const code = fs.readFileSync(file, 'utf8')
      const sourceMap = getSourceMap(file)
      const problems = check(file, code, {
        ...options,
        silent: false,
        sourceMap
      })
      if (
        problems.find(problem => {
          return !(problem.type === 'warning' && useAllRules)
        })
      ) {
        hasProblem = true
      }
    })
  })

  return { code: hasProblem ? 1 : 0 }
}

export default parseCode
export { check }

// Allow `require('@mpxjs/es-check')` without `.default`
module.exports = parseCode
module.exports.default = parseCode
module.exports.check = check
