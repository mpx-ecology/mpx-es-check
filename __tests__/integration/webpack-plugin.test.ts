/**
 * webpack 插件集成测试
 *
 * 通过 webpack compiler API 在内存中执行构建，验证 EsCheckPlugin 的行为。
 * 所有产物写入内存文件系统（memfs），不落盘。
 */
import path from 'path'
import webpack from 'webpack'
import { createFsFromVolume, Volume } from 'memfs'
import EsCheckPlugin from '../../src/lib/webpack-plugin'
import type { Configuration } from 'webpack'

const FIXTURES = path.join(__dirname, '../fixtures')

/** 运行 webpack，返回 stats */
function runWebpack (entry: string, pluginOpts: ConstructorParameters<typeof EsCheckPlugin>[0]): Promise<webpack.Stats> {
  const vol = new Volume()
  const memfs = createFsFromVolume(vol)

  const config: Configuration = {
    mode: 'development',
    entry: path.join(FIXTURES, entry),
    output: {
      path: '/dist',
      filename: 'bundle.js',
      // 让 webpack runtime 也生成 ES5 语法，避免干扰 es-check 结果
      environment: {
        arrowFunction: false,
        const: false,
        templateLiteral: false,
        destructuring: false,
        forOf: false,
        bigIntLiteral: false,
        optionalChaining: false,
      }
    },
    devtool: 'source-map',
    plugins: [new EsCheckPlugin(pluginOpts)],
    optimization: { minimize: false }
  }

  const compiler = webpack(config)
  // 将产物写入内存
  compiler.outputFileSystem = memfs as unknown as webpack.Compiler['outputFileSystem']

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err)
      resolve(stats!)
    })
  })
}

/** 从 stats.compilation.errors 中提取字符串 */
function getErrors (stats: webpack.Stats): string[] {
  return stats.compilation.errors.map(e => String(e))
}

// ─────────────────────────────────────────────────────────────────
// 基础功能：报错 / 通过
// ─────────────────────────────────────────────────────────────────
describe('EsCheckPlugin 基础功能', () => {
  test('纯 ES5 代码 + target=es5 → 构建通过，无报错', async () => {
    const stats = await runWebpack('wp-entry-es5.js', { target: 'es5', sourceType: 'script' })
    expect(getErrors(stats)).toHaveLength(0)
  })

  test('ES2015 代码 + target=es5 → 构建失败，报 es-check 错误', async () => {
    const stats = await runWebpack('wp-entry-es2015.js', { target: 'es5', sourceType: 'script' })
    const errors = getErrors(stats)
    expect(errors.some(e => e.includes('es-check'))).toBe(true)
  })

  test('ES2015 代码 + target=es2015 → 构建通过，无报错', async () => {
    const stats = await runWebpack('wp-entry-es2015.js', { target: 'es2015', sourceType: 'script' })
    expect(getErrors(stats)).toHaveLength(0)
  })

  test('Hermes 不支持的 API + target=hermes → 构建失败', async () => {
    const stats = await runWebpack('wp-entry-hermes.js', { target: 'hermes', sourceType: 'script' })
    const errors = getErrors(stats)
    expect(errors.some(e => e.includes('es-check'))).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────
// ignorePolyfills
// ─────────────────────────────────────────────────────────────────
describe('EsCheckPlugin ignorePolyfills', () => {
  test('默认开启：fake core-js 路径下的报错被忽略，构建通过', async () => {
    const stats = await runWebpack('wp-entry-polyfill.js', { target: 'hermes', sourceType: 'script' })
    expect(getErrors(stats)).toHaveLength(0)
  })

  test('ignorePolyfills=false：fake core-js 路径下的报错不被忽略，构建失败', async () => {
    const stats = await runWebpack('wp-entry-polyfill.js', {
      target: 'hermes',
      sourceType: 'script',
      ignorePolyfills: false
    })
    const errors = getErrors(stats)
    expect(errors.some(e => e.includes('es-check'))).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────
// ignoreSource
// ─────────────────────────────────────────────────────────────────
describe('EsCheckPlugin ignoreSource', () => {
  test('ignorePolyfills=false 时仍可按 npm 包名忽略指定来源', async () => {
    const stats = await runWebpack('wp-entry-polyfill.js', {
      target: 'hermes',
      sourceType: 'script',
      ignorePolyfills: false,
      ignoreSource: ['core-js']
    })
    expect(getErrors(stats)).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────
// allowSyntax
// ─────────────────────────────────────────────────────────────────
describe('EsCheckPlugin allowSyntax', () => {
  test('不配置：ES2015 代码 + target=es5 报错', async () => {
    const stats = await runWebpack('wp-entry-es2015.js', { target: 'es5', sourceType: 'script' })
    expect(getErrors(stats).some(e => e.includes('es-check'))).toBe(true)
  })

  test('按 nodeType 白名单箭头函数 + TemplateLiteral：报错消失，构建通过', async () => {
    const stats = await runWebpack('wp-entry-es2015.js', {
      target: 'es5',
      sourceType: 'script',
      allowSyntax: ['ArrowFunctionExpression', 'TemplateLiteral', 'VariableDeclaration']
    })
    expect(getErrors(stats)).toHaveLength(0)
  })

  test('按 message 子串白名单 Map.groupBy：groupBy 报错消失，其他仍报错', async () => {
    const stats = await runWebpack('wp-entry-hermes.js', {
      target: 'hermes',
      sourceType: 'script',
      allowSyntax: ['Map.groupBy']
    })
    const errors = getErrors(stats)
    // Object.groupBy 仍应报错
    expect(errors.some(e => e.includes('es-check'))).toBe(true)
    // Map.groupBy 不出现在错误信息里
    expect(errors.every(e => !e.includes('Map.groupBy'))).toBe(true)
  })

  test('白名单全部 hermes 不支持项：构建通过', async () => {
    const stats = await runWebpack('wp-entry-hermes.js', {
      target: 'hermes',
      sourceType: 'script',
      allowSyntax: ['Map.groupBy', 'Object.groupBy']
    })
    expect(getErrors(stats)).toHaveLength(0)
  })
})
