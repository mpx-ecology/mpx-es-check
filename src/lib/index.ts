import * as parser from '@babel/parser'
import fs from 'fs'
import glob from 'glob'
import { Instance as ChalkInstance } from 'chalk'
import runRules from './check'
import { getLogOutputPath } from './util'
import { applySourceMap, formatProblems, formatProblemsPlain } from './format'
import collectRule from './collect-rule'
import type { Problem, Rule } from '../types'

const chalk = new ChalkInstance()

const acornBaseOpts = { ecmaVersion: 2050 as 2050, silent: true, locations: true }

interface ParseCodeOptions {
  rule?: string
  /** @deprecated use `rule` instead */
  version?: string
  esmodule?: boolean | string
  files: string[]
  ignore?: string[]
  useAllRules?: boolean
  output?: string | null
  checkMiniprogram?: boolean
  customRules?: Rule
  sourceMap?: string
  silent?: boolean
  [key: string]: unknown
}

function resolveRule (options: ParseCodeOptions): string | undefined {
  if (options.version && !options.rule) {
    process.stderr.write('Warning: ParseCodeOptions.version is deprecated, please use `rule` instead\n')
    return options.version
  }
  return options.rule
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

function check (file: string, code: string, options: ParseCodeOptions): Problem[] {
  const {
    esmodule,
    useAllRules,
    checkMiniprogram,
    silent,
    output
  } = options
  const rule = resolveRule(options)

  const acornOpts = { ...acornBaseOpts, sourceType: esmodule ? ('module' as const) : ('script' as const) }
  const configuredRules = collectRule(rule, useAllRules ?? false, options, checkMiniprogram)
  const ast = parser.parse(code, acornOpts)
  const problems = runRules({ ast: ast as unknown as import('../types').ASTNode }, configuredRules) || []
  if (!silent && problems.length) {
    problems.forEach(p => { p.file = file })
    applySourceMap(problems, options.sourceMap)
    console.log(formatProblems(problems, chalk))
    if (output) {
      const logger = createLogger(output)
      logger.log(formatProblemsPlain(problems))
    }
  }
  return problems
}

function parseCode (options: ParseCodeOptions): { code: number } {
  const rule = resolveRule(options)
  // Normalize to avoid duplicate deprecation warnings inside check()
  const normalizedOptions: ParseCodeOptions = { ...options, rule, version: undefined }
  const { files, ignore, useAllRules, checkMiniprogram } = normalizedOptions

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
        ...normalizedOptions,
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
