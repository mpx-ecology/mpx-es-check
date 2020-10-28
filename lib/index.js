const acorn = require('acorn')
const parser = require('@babel/parser')
const fs = require('fs')
const glob = require('glob')
const runRules = require('./check')

const acornOpts = { ecmaVersion: 12, silent: true, locations: true }
acornOpts.sourceType = 'module'

function parseCode (esVersion, esmodule, files) {
  acornOpts.sourceType = esmodule
  const globOpts = { nodir: true }
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
      const problems = runRules({ ast: sourceCodeAst }, esVersion)
      if (problems.length) {
        // 如果有问题，则退出值非0
        process.exitCode = 1
      }
      // TODO 输出 problems 到终端或者 本地文件
      console.log(problems)
    })
  })
}

module.exports = parseCode
