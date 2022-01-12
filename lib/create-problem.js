function createProblem (options) {
  let nodeLoc = options.node && options.node.loc
  if (!nodeLoc) {
    nodeLoc = {
      start: options.node.start,
      end: options.node.end
    }
  }
  const problem = {
    message: options.message,
    nodeType: (options.node && options.node.type) || null
  }

  if (options.messageId) {
    problem.messageId = options.messageId
  }

  if (nodeLoc.end) {
    problem.endLine = nodeLoc.end.line
    problem.endColumn = nodeLoc.end.column + 1
  }

  if (nodeLoc.start) {
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

module.exports = createProblem
