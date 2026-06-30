// eslint-disable-next-line @typescript-eslint/no-var-requires
import type { Problem } from '../types'
const SourceMap = require('source-map')

interface SyncSourceMapConsumer {
  originalPositionFor(pos: { line: number; column: number }): { source: string | null; line: number | null; column: number | null }
  destroy?(): void
}

/**
 * 用 sourcemap 将 problems 中的行列号映射回源文件
 * @param projectRoot 可选，传入后会将 webpack:// 虚拟路径替换为绝对路径
 */
export function applySourceMap (problems: Problem[], sourceMapCode: string | undefined, projectRoot?: string): void {
  if (!sourceMapCode || !problems.length) return
  let consumer: SyncSourceMapConsumer | null = null
  try {
    consumer = new SourceMap.SourceMapConsumer(sourceMapCode) as SyncSourceMapConsumer
    problems.forEach(problem => {
      try {
        const origin = (consumer as SyncSourceMapConsumer).originalPositionFor({
          line: problem.startLine ?? 0,
          column: problem.startColumn ?? 0
        })
        if (origin.source != null) {
          let sourceFile = origin.source
          if (projectRoot) {
            // webpack:// 虚拟路径转换为绝对路径，例如 webpack://proj/./src/foo.js → /abs/src/foo.js
            sourceFile = sourceFile.replace(/^webpack:\/\/[^/]*\//, projectRoot + '/')
          }
          problem.sourceFile = sourceFile
          problem.sourceLine = origin.line ?? undefined
          problem.sourceColumn = origin.column ?? undefined
        }
      } catch (e) {
        console.error('error resolving sourcemap position:', e)
      }
    })
  } finally {
    if (consumer && typeof consumer.destroy === 'function') {
      consumer.destroy()
    }
  }
}

/**
 * 将 problems 按源文件分组，渲染为 ESLint 风格的彩色字符串（用于终端输出）
 */
export function formatProblems (problems: Problem[], chalk: { underline: (s: string) => string; dim: (s: string) => string; yellow: (s: string) => string; red: (s: string) => string }): string {
  const byFile = new Map<string, Problem[]>()
  problems.forEach(problem => {
    const file = problem.sourceFile || problem.file || '<unknown>'
    if (!byFile.has(file)) byFile.set(file, [])
    ;(byFile.get(file) as Problem[]).push(problem)
  })

  const lines: string[] = []
  byFile.forEach((fileProblems, file) => {
    lines.push(chalk.underline(file))
    fileProblems.forEach(problem => {
      const line = problem.sourceLine != null ? problem.sourceLine : problem.startLine
      const col = problem.sourceColumn != null ? problem.sourceColumn : problem.startColumn
      const loc = chalk.dim(`${line}:${col}`)
      const level = problem.type === 'warning'
        ? chalk.yellow('warning')
        : chalk.red('error')
      lines.push(`  ${loc}  ${level}  ${problem.message}`)
    })
    lines.push('')
  })
  return lines.join('\n')
}

/**
 * 将 problems 渲染为无颜色的纯文本（用于写入日志文件）
 */
export function formatProblemsPlain (problems: Problem[]): string {
  const byFile = new Map<string, Problem[]>()
  problems.forEach(problem => {
    const file = problem.sourceFile || problem.file || '<unknown>'
    if (!byFile.has(file)) byFile.set(file, [])
    ;(byFile.get(file) as Problem[]).push(problem)
  })

  const lines: string[] = []
  byFile.forEach((fileProblems, file) => {
    lines.push(file)
    fileProblems.forEach(problem => {
      const line = problem.sourceLine != null ? problem.sourceLine : problem.startLine
      const col = problem.sourceColumn != null ? problem.sourceColumn : problem.startColumn
      const level = problem.type === 'warning' ? 'warning' : 'error'
      lines.push(`  ${line}:${col}  ${level}  ${problem.message}`)
    })
    lines.push('')
  })
  return lines.join('\n')
}
