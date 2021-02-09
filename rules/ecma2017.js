module.exports = {
  meta: {
    docs: {
      description: 'ecma2017 rules'
    }
  },
  create (context) {
    return {
      'FunctionDeclaration|ArrowFunctionExpression' (node) {
        if (node.async === true) {
          context.report({
            node,
            message: 'Using async function is not allowed'
          })
        }
      },
      AwaitExpression (node) {
        if (node.operator === '**=') {
          context.report({
            node,
            message: 'Using AwaitExpression await is not allowed'
          })
        }
      }
    }
  }
}
