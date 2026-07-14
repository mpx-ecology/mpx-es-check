export interface Problem {
  message: string
  nodeType: string | null
  messageId?: string
  startLine?: number
  startColumn?: number
  endLine?: number
  endColumn?: number
  fix?: unknown
  type?: 'warning'
  file?: string
  sourceFile?: string
  sourceLine?: number
  sourceColumn?: number
}

export type ASTNode = {
  type: string
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } }
  start?: number | { line: number; column: number }
  end?: number | { line: number; column: number }
  parent?: ASTNode
  [key: string]: unknown
}

export interface RuleContext {
  id: number
  options: unknown[]
  report(opts: { node: ASTNode; message: string; loc?: unknown; type?: 'warning' }): void
}

export type RuleVisitors = Record<string, (node: ASTNode, path?: unknown) => void>

export interface Rule {
  meta: { docs: { description: string } }
  create(context: RuleContext): RuleVisitors
}

export interface SafeEmitter {
  on(eventName: string, listener: (...args: unknown[]) => void): void
  emit(eventName: string, ...args: unknown[]): void
  eventNames(): string[]
}
