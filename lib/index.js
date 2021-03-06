const parser = require('@babel/parser')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const runRules = require('./check')
const ProgressBar = require('./progress-bar')
const { getLogOutputPath } = require('./util')
const { versionMap } = require('./constant')

const acornOpts = { ecmaVersion: 12, silent: true, locations: true }

/**
 * 解析代码并分析是否有不符合的语法/实例方法
 * @param version {string} - version of rules applied
 * @param esmodule {string} - a modular way to parse code
 * @param files {Array<string>} - list of files to check
 * @param useAllRules {boolean} - check code use all rules: include instance method & static method
 * @param output {string} - output path of result log
 * @return {{code: number, msg: string}}
 */
function parseCode ({ version, esmodule, files, useAllRules, output }) {
  const esVersion = versionMap[version]

  if (!esVersion) {
    return {
      code: 1,
      msg: 'Invalid ecmaScript version'
    }
  }

  const resultOutputPath = getLogOutputPath(output)

  const globOpts = { nodir: true }
  const stderr = fs.createWriteStream(resultOutputPath, { flags: 'a', encoding: 'utf-8' })
  const logger = new console.Console(stderr)
  const pb = new ProgressBar('检测进度')
  let hasProblem = false
  acornOpts.sourceType = esmodule ? 'module' : 'script'
  try {
    fs.writeFileSync(resultOutputPath, '')
  } catch (e) {
    console.log(e)
  }
  const isTerminalRun = files.length > 1
  files.forEach((pattern, index) => {
    const globbedFiles = glob.sync(pattern, globOpts)
    isTerminalRun ? pb.render({ completed: index + 1, total: files.length }) : null

    if (globbedFiles.length === 0) {
      // 未匹配到文件，异常退出
      console.warn('未匹配到任何文件，请确认！')
      process.exit(1)
    }
    globbedFiles.forEach((file, index) => {
      !isTerminalRun ? pb.render({ completed: index + 1, total: globbedFiles.length }) : null
      const code = fs.readFileSync(file, 'utf8')
      const sourceCodeAst = parser.parse(code, acornOpts)
      const problems = runRules({ ast: sourceCodeAst }, esVersion, useAllRules) || []
      if (problems.length) {
        // 如果有问题，则退出值非0
        problems.forEach((problem) => {
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
          if (problem.type === 'warning' && useAllRules) {
            logger.log(`WARNING:
            ${problem.message}
            at file: ${file}
            at startLine: ${problem.startLine}
            at startColumn: ${problem.startColumn}
            `
            )
          } else {
            logger.log(`ERROR:
            ${problem.message}
            at file: ${file}
            at startLine: ${problem.startLine}
            at startColumn: ${problem.startColumn}
            `
            )
            hasProblem = true
          }
        })
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

module.exports = parseCode
