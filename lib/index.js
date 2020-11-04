const parser = require('@babel/parser')
const fs = require('fs')
const chalk = require('chalk')
const glob = require('glob')
const path = require('path')
const runRules = require('./check')
const ProgressBar = require('./progress-bar')
const resultOutputPath = path.resolve() + '/es-check.log'

const acornOpts = { ecmaVersion: 12, silent: true, locations: true }
acornOpts.sourceType = 'module'

function parseCode (esVersion, esmodule, files) {
  acornOpts.sourceType = esmodule
  const globOpts = { nodir: true }
  const stderr = fs.createWriteStream(resultOutputPath, { flags: 'a', encoding: 'utf-8' })
  const logger = new console.Console(stderr)
  const pb = new ProgressBar('检测进度', files.length)
  let hasProblem = false
  try {
    fs.writeFileSync(resultOutputPath, '')
  } catch (e) {

  }
  files.forEach((pattern, index) => {
    pb.render({ completed: index + 1, total: files.length })
    const globbedFiles = glob.sync(pattern, globOpts)
    if (globbedFiles.length === 0) {
      // 未匹配到文件，异常退出
      console.warn('未匹配到任何文件，请确认！')
      process.exit(1)
    }
    globbedFiles.forEach((file) => {
      const code = fs.readFileSync(file, 'utf8')
      const sourceCodeAst = parser.parse(code, acornOpts)
      const problems = runRules({ ast: sourceCodeAst }, esVersion) || []
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
          if (problem.type === 'warning') {
            // logger.log(`WARNING:
            // ${problem.message}
            // at file: ${file}
            // at startLine: ${problem.startLine}
            // at startColumn: ${problem.startColumn}
            // `
            // )
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
        process.exitCode = 1
      }
    })
  })
  if (hasProblem) {
    console.log(chalk.red(`\n检测到语法错误, 详情请查看文件: 
      ${path.resolve()}/dist/es-check.log
    `))
  }
}

module.exports = parseCode
