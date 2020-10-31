module.exports = {
  meta: {
    docs: {
      description: 'ecma2016 rules'
    }
  },
  create (context) {
    return {
      BinaryExpression (node) {
        if (node.operator === '**') {
          context.report({
            node,
            message: 'Using BinaryExpression operator ** is not allowed'
          })
        }
      },
      BinaryExpression (node) {
        if (node.operator === '*') {
          context.report({
            node,
            message: 'Using BinaryExpression operator ** is not allowed'
          })
        }
      },
      AssignmentExpression (node) {
        if (node.operator === '**=') {
          context.report({
            node,
            message: 'Using AssignmentExpression operator **= is not allowed'
          })
        }
      }
    }
  }
}
