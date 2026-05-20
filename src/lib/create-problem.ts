import type { Problem, ASTNode } from '../types'

interface CreateProblemOptions {
  node: ASTNode
  message: string
  messageId?: string
  loc?: unknown
  fix?: unknown
  type?: 'warning'
}

function createProblem (options: CreateProblemOptions): Problem {
  const nodeWithLoc = options.node as {
    loc?: { start: { line: number; column: number }; end: { line: number; column: number } }
    start?: { line: number; column: number } | number
    end?: { line: number; column: number } | number
    type?: string
  }

  let nodeLoc = nodeWithLoc.loc
  if (!nodeLoc) {
    nodeLoc = {
      start: nodeWithLoc.start as { line: number; column: number },
      end: nodeWithLoc.end as { line: number; column: number }
    }
  }

  const problem: Problem = {
    message: options.message,
    nodeType: (options.node && options.node.type) || null
  }

  if (options.messageId) {
    problem.messageId = options.messageId
  }

  if (nodeLoc && nodeLoc.end) {
    problem.endLine = nodeLoc.end.line
    problem.endColumn = nodeLoc.end.column + 1
  }

  if (nodeLoc && nodeLoc.start) {
    problem.startLine = nodeLoc.start.line
    problem.startColumn = nodeLoc.start.column
  }

  if (options.fix) {
    problem.fix = options.fix
  }

  if (options.type) {
    problem.type = options.type
  }

  return problem
}

export default createProblem
