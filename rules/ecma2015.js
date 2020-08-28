module.exports = {
  meta: {
    docs: {
      description: "use VariableDeclaration let or const ",
    }
  },
  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind === 'let' || node.kind === 'const') {
          context.report({
            node,
            loc: { start: node.start, end: node.end },
            message: `Using ${node.kind} is not allowed`
          })
        }
      }
    }
  }
}
