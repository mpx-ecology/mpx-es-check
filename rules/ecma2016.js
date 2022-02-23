module.exports = function (usePlugin) {
  return {
    meta: {
      docs: {
        description: 'ecma2016 rules'
      }
    },
    create (context) {
      return {
        BinaryExpression (node) {
          if (node.operator === '**' && usePlugin.has('exponentiation-operator')) {
            context.report({
              node,
              message: 'Using BinaryExpression operator ** is not allowed'
            })
          }
        },
        AssignmentExpression (node) {
          if (node.operator === '**=' && usePlugin.has('exponentiation-operator')) {
            context.report({
              node,
              message: 'Using AssignmentExpression operator **= is not allowed'
            })
          }
        }
      }
    }
  }
}
