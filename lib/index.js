// const acorn = require('acorn')
const parser = require('@babel/parser')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const runRules = require('./check')
const { getLogOutputPath } = require('./util')
const { versionMap } = require('./constant')
const SourceMap = require('source-map')
const collectRule = require('./collect-rule')

const acornOpts = { ecmaVersion: 2050, silent: true, locations: true }

/**
 * 解析代码并分析是否有不符合的语法/实例方法
 * @param version {string} - version of rules applied
 * @param esmodule {string} - a modular way to parse code
 * @param files {Array<string>} - list of files to check
 * @param useAllRules {boolean} - check code use all rules: include instance method & static method
 * @param output {string} - output path of result log
 * @return {{code: number, msg: string}}
 */
function parseCode (options) {
  const { version, files, useAllRules } = options
  const esVersion = versionMap[version]

  if (!esVersion) {
    return {
      code: 1,
      msg: 'Invalid ecmaScript version'
    }
  }

  const globOpts = { nodir: true }
  // const pb = new ProgressBar('检测进度')
  console.log('开始检测文件...')
  let hasProblem = false

  // const isTerminalRun = files.length > 1
  files.forEach(pattern => {
    const globbedFiles = glob.sync(pattern, globOpts)
    // isTerminalRun ? pb.render({ completed: index + 1, total: files.length }) : null

    if (globbedFiles.length === 0) {
      // 未匹配到文件，异常退出
      console.warn('未匹配到任何文件，请确认！')
      process.exit(1)
    }
    globbedFiles.forEach(file => {
      // !isTerminalRun ? pb.render({ completed: index + 1, total: globbedFiles.length }) : null
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

  if (hasProblem) {
    return {
      code: 1,
      msg: `\n检测到语法错误, 详情请查看文件:
      ${path.resolve()}/dist/es-check.log
    `
    }
  } else {
    return {
      code: 0,
      msg: `\n项目语法检测完成, 并无错误输出
    `
    }
  }
}

function getSourceMap (file) {
  let sourceMapCode
  try {
    // TODO 暂时对于 soucemap 的检测目前仅只去查看是否存在，后续补全内联等其它种情况
    if (fs.existsSync(file + '.map')) {
      sourceMapCode = fs.readFileSync(file + '.map', 'utf-8')
    }
  } catch (e) {
    console.log('error:', e)
  }
  return sourceMapCode
}

let logger = null
function createLogger (output) {
  if (logger) return logger
  const resultOutputPath = getLogOutputPath(output)
  try {
    fs.writeFileSync(resultOutputPath, '')
  } catch (e) {
    console.log(e)
  }
  const stderr = fs.createWriteStream(resultOutputPath, {
    flags: 'a',
    encoding: 'utf-8'
  })

  return (logger = new console.Console(stderr))
}

function check (file, code, options) {
  const {
    version,
    esmodule,
    useAllRules,
    silent,
    output
  } = options

  acornOpts.sourceType = esmodule ? 'module' : 'script'
  // const esVersion = versionMap[version]
  const configuredRules = collectRule(version, useAllRules)
  // const sourceCodeAst = acorn.parse(code, acornOpts)
  const ast = parser.parse(code, acornOpts)
  const problems =
    runRules({ ast }, configuredRules) || []
  if (!silent && problems.length) {
    const logger = createLogger(output)
    let sourceMapConsumer = null
    let originResult = null
    if (options.sourceMap) {
      sourceMapConsumer = new SourceMap.SourceMapConsumer(options.sourceMap)
    }
    // 如果有问题，则退出值非0
    problems.forEach(problem => {
      /**
       * {
          message: 'Using let is not allowed',
          nodeType: 'VariableDeclaration',
          endLine: 6,
          endColumn: 12,
          startLine: 6,
          startColumn: 0
        }
       */
      try {
        if (sourceMapConsumer) {
          originResult = sourceMapConsumer.originalPositionFor({
            line: problem.startLine,
            column: problem.startColumn
          })
        }
      } catch (e) {
        console.log('error:', e)
      }
      if (problem.type === 'warning' && options.useAllRules) {
        if (originResult) {
          logger.log(`WARNING:
          ${problem.message}
          at file: ${file}
          at startLine: ${problem.startLine}
          at startColumn: ${problem.startColumn}
          sourcemap parse file: ${originResult.source}
          sourcemap parse line: ${originResult.line}
          sourcemap parse column: ${originResult.column}
          `)
        } else {
          logger.log(`WARNING:
          ${problem.message}
          at file: ${file}
          at startLine: ${problem.startLine}
          at startColumn: ${problem.startColumn}
          `)
        }
      } else {
        if (originResult) {
          logger.log(`ERROR:
          ${problem.message}
          at file: ${file}
          at startLine: ${problem.startLine}
          at startColumn: ${problem.startColumn}
          sourcemap parse file: ${originResult.source}
          sourcemap parse line: ${originResult.line}
          sourcemap parse column: ${originResult.column}
          `)
        } else {
          logger.log(`ERROR:
          ${problem.message}
          at file: ${file}
          at startLine: ${problem.startLine}
          at startColumn: ${problem.startColumn}
          `)
        }
      }
    })
  }
  return problems
}

module.exports = parseCode

module.exports.check = check
