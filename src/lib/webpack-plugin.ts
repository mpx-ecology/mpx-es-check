/**
 * webpack plugin 方式使用
 * 依赖 webpack5 版本
 */
import path from 'path'
import fs from 'fs'
import { Instance as ChalkInstance } from 'chalk'
import runRules from './check'
import parseAsset from './parse-assets'
import webpack from 'webpack'
import collectRule from './collect-rule'
import { applySourceMap, formatProblems, formatProblemsPlain } from './format'
import type { Compiler, Compilation } from 'webpack'
import type { Problem, ASTNode, Rule } from '../types'

const isWebpack5 = webpack.version && webpack.version[0] > '4'

interface EsCheckPluginOptions {
  target?: string
  sourceType?: string
  filename?: string
  customRules?: Rule & { callback?: (result: { warnings: Problem[][]; errors: Problem[][] }, options: EsCheckPluginOptions, compilation: Compilation) => void }
  [key: string]: unknown
}

interface TraversedInfo {
  hasProblem: boolean
  blockProblems?: Problem[]
  nonBlockProblems?: Problem[]
}

class EsCheckPlugin {
  private options: EsCheckPluginOptions

  constructor (opts: EsCheckPluginOptions = {}) {
    this.options = opts
  }

  apply (compiler: Compiler): void {
    const statsColors = (compiler.options.stats as { colors?: boolean } | undefined)?.colors
    const chalkLevel = statsColors === false ? 0 : new ChalkInstance().level
    const c = new ChalkInstance({ level: chalkLevel })

    compiler.hooks.thisCompilation.tap('EsCheckPlugin', (compilation) => {
      compilation.hooks.assetPath.tap('EsCheckPlugin', (assetPath, data, assetInfo): string => {
        const d = data as { chunk?: { name: string } }
        const info = assetInfo as { chunkName?: string } | undefined
        if (d.chunk && info) {
          info.chunkName = d.chunk.name
        }
        return assetPath
      })
    })

    const writeFilePromise = (file: string, content: string): Promise<void> => new Promise((resolve, reject) => {
      fs.writeFile(file, content, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    let allBlockProblems: Problem[][] = []
    let allNonBlockProblems: Problem[][] = []

    compiler.hooks.emit.tapPromise({
      name: 'EsCheckPlugin',
      stage: 2000
    }, async (compilation) => {
      allBlockProblems = []
      allNonBlockProblems = []
      const { target, sourceType } = this.options
      if (!target || !sourceType) {
        console.error('配置项不全')
        return
      }

      const mpx = (compilation as unknown as { __mpx__?: { assetsASTsMap?: Map<string, ASTNode> } }).__mpx__
      const logger = compilation.getLogger('EsCheckPlugin')
      const cache = compilation.getCache ? compilation.getCache('EsCheckPlugin') : (compilation as unknown as { cache: unknown }).cache

      logger.time('es check')
      for (const name in compilation.assets) {
        const assetInfo = compilation.assetsInfo.get(name) as { chunkName?: string } | undefined
        if (/\.m?js$/i.test(name)) {
          const chunk = compilation.namedChunks.get(assetInfo?.chunkName ?? '')
          const etag = chunk ? (chunk as unknown as { contentHash: { javascript: string } }).contentHash.javascript : null
          const content = compilation.assets[name].source() as string
          const ast = mpx && mpx.assetsASTsMap && mpx.assetsASTsMap.get(name)
          let problems: Problem[] = []
          const blockProblems: Problem[] = []
          const nonBlockProblems: Problem[] = []

          let traversedInfo: TraversedInfo | null = (etag ? await (cache as { getPromise: (name: string, etag: string) => Promise<TraversedInfo | null> }).getPromise(name, etag) : null)
          if (!traversedInfo) {
            try {
              const result = parseAsset(content, ast)
              if (mpx && mpx.assetsASTsMap) {
                mpx.assetsASTsMap.set(name, result.ast)
              }
              const configuredRules = collectRule(target, false, this.options)
              problems = runRules({ ast: result.ast }, configuredRules, true) || []
              traversedInfo = { hasProblem: false }

              if (problems.length) {
                problems.forEach(p => { p.file = name })
                const sourceMapAsset = compilation.assets[name + '.map']
                const sourceMapCode = sourceMapAsset && (sourceMapAsset as unknown as { _value?: string })._value
                applySourceMap(problems, sourceMapCode, compiler.context)
                problems.forEach(problem => {
                  if (problem.type === 'warning') {
                    nonBlockProblems.push(problem)
                  } else {
                    blockProblems.push(problem)
                  }
                })
                if (blockProblems.length) {
                  traversedInfo.blockProblems = blockProblems
                }
                if (nonBlockProblems.length) {
                  traversedInfo.nonBlockProblems = nonBlockProblems
                }
              }
              if (etag) {
                await (cache as { storePromise: (name: string, etag: string, info: TraversedInfo) => Promise<void> }).storePromise(name, etag, traversedInfo)
              }
            } catch (err) {
              const e = err as { code?: string; message: string }
              const msg = e.code === 'ENOENT' ? 'no such file' : e.message
              const error = `Error es check bundle asset "${name}": ${msg}`
              if (isWebpack5) {
                (compilation.errors as unknown[]).push(error)
              } else {
                compilation.warnings.push(new (webpack as unknown as { WebpackError: new (msg: string) => Error }).WebpackError(error))
              }
              continue
            }
          }
          if (traversedInfo.blockProblems && traversedInfo.blockProblems.length) {
            allBlockProblems.push(traversedInfo.blockProblems)
          }
          if (traversedInfo.nonBlockProblems && traversedInfo.nonBlockProblems.length) {
            allNonBlockProblems.push(traversedInfo.nonBlockProblems)
          }
        }
      }

      if (allBlockProblems.length) {
        const flatProblems = allBlockProblems.flat()
        const formatted = formatProblems(flatProblems, c)
        const fileTip = this.options.filename
          ? `，详情见 ${path.resolve(compiler.outputPath, this.options.filename)}`
          : ''
        const error = `es-check 检测到以下语法错误${fileTip}:\n\n${formatted}`
        if (isWebpack5) {
          (compilation.errors as unknown[]).push(error)
        } else {
          compilation.warnings.push(new Error(error))
        }
      }
    })

    compiler.hooks.afterEmit.tapPromise({
      name: 'EsCheckPlugin'
    }, async (compilation) => {
      if (this.options.customRules && this.options.customRules.callback && allNonBlockProblems) {
        this.options.customRules.callback({
          warnings: allNonBlockProblems,
          errors: allBlockProblems
        }, this.options, compilation)
      }
      if (this.options.filename && allBlockProblems.length) {
        const esCheckFilePath = path.resolve(compiler.outputPath, this.options.filename)
        const logger = compilation.getLogger('EsCheckPlugin')
        const flatProblems = allBlockProblems.flat()
        await writeFilePromise(esCheckFilePath, formatProblemsPlain(flatProblems))
        logger.info(`es-check errors is generated in ${esCheckFilePath}!`)
      }
    })
  }
}

export default EsCheckPlugin
// Allow `require('@mpxjs/es-check/webpack-plugin')` without `.default`
module.exports = EsCheckPlugin
module.exports.default = EsCheckPlugin
