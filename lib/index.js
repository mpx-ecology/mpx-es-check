const parser = require('@babel/parser')
const fs = require('fs')
const glob = require('glob')
const chalk = require('chalk')
const runRules = require('./check')
const log = console.log

const acornOpts = {ecmaVersion: 12, silent: true, locations: true}
acornOpts.sourceType = 'module'

function parseCode(esVersion, esmodule, files) {
  acornOpts.sourceType = esmodule
  const globOpts = {nodir: true}
  files.forEach((pattern) => {
    const globbedFiles = glob.sync(pattern, globOpts)

    if (globbedFiles.length === 0) {
      // 未匹配到文件，异常退出
      console.warn('未匹配到任何文件，请确认！')
      process.exit(1)
    }

    globbedFiles.forEach((file) => {
      const code = fs.readFileSync(file, 'utf8')
      const sourceCodeAst = parser.parse(code, acornOpts)
      const problems = runRules({ast: sourceCodeAst}, esVersion)
      if (problems.length) {
        // log(chalk.blue(`=======================`))
        // // 如果有问题，则退出值非0
        // problems.forEach((problem) => {
        //   /**
        //    * {
        //       message: 'Using let is not allowed',
        //       nodeType: 'VariableDeclaration',
        //       endLine: 6,
        //       endColumn: 12,
        //       startLine: 6,
        //       startColumn: 0
        //     }
        //    */
        //   if (problem.type === 'warning') {
        //     log(chalk.yellow(`WARNING:
        //     ${problem.message}
        //     at file: ${file}
        //     at startLine: ${problem.startLine}
        //     at startColumn: ${problem.startColumn}
        //     `
        //     ))
        //   } else {
        //     log(chalk.red(`ERROR:
        //     ${problem.message}
        //     at file: ${file}
        //     at startLine: ${problem.startLine}
        //     at startColumn: ${problem.startColumn}
        //     `
        //     ))
        //   }
        // })
        // log(chalk.blue(`=======================`))
        process.exitCode = 1
      }
    })
  })
}

module.exports = parseCode
