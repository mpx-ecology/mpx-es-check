/**
 * webpack plugin 方式使用
 * 依赖 webpack5 版本
 */
const path = require('path')
const fs = require('fs')
const sourceMap = require('source-map')
// const { versionMap } = require('./constant')
const runRules = require('./check')
const parseAsset = require('./parse-assets')
const webpack = require('webpack')
const collectRule = require('./collect-rule')

const isWebpack5 = webpack.version && webpack.version[0] > 4

class EsCheckPlugin {
  constructor (opts = {}) {
    this.options = opts
  }

  apply (compiler) {
    compiler.hooks.thisCompilation.tap('EsCheckPlugin', (compilation) => {
      compilation.hooks.assetPath.tap('EsCheckPlugin', (path, data, assetInfo) => {
        if (data.chunk && assetInfo) {
          assetInfo.chunkName = data.chunk.name
        }
      })
    })

    const writeFilePromise = (file, content) => new Promise((resolve, reject) => {
      fs.writeFile(file, content, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    const allProblems = []
    compiler.hooks.emit.tapPromise({
      name: 'EsCheckPlugin',
      // 在最后assets稳定后执行
      stage: 2000
    }, async (compilation) => {
      const { version, sourceType } = this.options
      if (!version || !sourceType) {
        console.error('配置项不全')
        return
      }
      const { __mpx__: mpx } = compilation
      // const esVersion = versionMap[version]
      const logger = compilation.getLogger('EsCheckPlugin')
      const cache = compilation.getCache ? compilation.getCache('EsCheckPlugin') : compilation.cache
      // 存储检测失败对应的name，这部分module就算有缓存但还是需要再次检测并进行错误输出
      logger.time('es check')
      for (const name in compilation.assets) {
        const assetInfo = compilation.assetsInfo.get(name)
        if (/\.m?js$/i.test(name)) {
          // TODO 添加无assetInfo.chunkName的处理
          const chunk = compilation.namedChunks.get(assetInfo.chunkName)
          const etag = chunk ? chunk.contentHash.javascript : null
          const content = compilation.assets[name].source()
          const ast = mpx && mpx.assetsASTsMap.get(name)
          let problems = []
          let traversedInfo = etag && await cache.getPromise(name, etag)
          if (!traversedInfo) {
            try {
              const result = parseAsset(content, ast)
              mpx && mpx.assetsASTsMap.set(name, result.ast)
              /*
              * useAllRules: plugin模式，不能校验methodRules 因为webpack使用acorn，
              * 缺少解析ast的工具方法(例如 path.evaluate 等)
              * */
              const configuredRules = collectRule(version, false)
              problems = runRules({ ast: result.ast }, configuredRules, false) || []
              traversedInfo = {
                hasProblem: false
              }
              if (problems.length) {
                let originResult = null
                let sourceMapConsumer = null
                if (compilation.assets[name + '.map']) {
                  // 如果存在对应的source map 文件则计算真实源码路径
                  const sourceMapCode = compilation.assets[name + '.map']._value
                  sourceMapConsumer = new sourceMap.SourceMapConsumer(sourceMapCode)
                }
                problems = problems.map((problem) => {
                  problem.file = name
                  if (sourceMapConsumer) {
                    originResult = sourceMapConsumer.originalPositionFor({
                      line: problem.startLine,
                      column: problem.startColumn
                    })
                    problem.sourceFile = originResult.source
                    problem.sourceLine = originResult.line
                    problem.sourceColumn = originResult.column
                  }
                  return problem
                })
                traversedInfo.hasProblem = true
                traversedInfo.problems = problems
              }
              etag && await cache.storePromise(name, etag, traversedInfo)
            } catch (err) {
              const msg = err.code === 'ENOENT' ? 'no such file' : err.message
              const error = `Error es check bundle asset "${name}": ${msg}`
              if (isWebpack5) {
                compilation.errors.push(error)
              } else {
                compilation.warnings.push(new Error(error))
              }
              continue
            }
          }
          if (traversedInfo.hasProblem) {
            // 当存在语法检测报错时
            allProblems.push(traversedInfo.problems)
          }
        }
      }
      if (allProblems.length) {
        const esCheckFilePath = path.resolve(compiler.outputPath, this.options.filename || 'es-check.log')
        const error = `es check 检测到语法报错 es check errors is generated in ${esCheckFilePath}!`
        if (isWebpack5) {
          compilation.errors.push(error)
        } else {
          compilation.warnings.push(new Error(error))
        }
      }
    })

    compiler.hooks.afterEmit.tapPromise({
      name: 'EsCheckPlugin'
    }, async (compilation) => {
      if (allProblems.length) {
        const esCheckFilePath = path.resolve(compiler.outputPath, this.options.filename || 'es-check.log')
        // 处理对应的语法报错，收集输出到对应的文件夹
        const logger = compilation.getLogger('EsCheckPlugin')
        await writeFilePromise(esCheckFilePath, JSON.stringify(allProblems, null, 2))
        logger.info(`es check errors is generated in ${esCheckFilePath}!`)
      }
    })
  }
}

module.exports = EsCheckPlugin
