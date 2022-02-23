module.exports = function (usePlugin) {
  return {
    meta: {
      docs: {
        description: 'ecma2017 rules'
      }
    },
    create (context) {
      return {
        FunctionDeclaration (node) {
          if (node.async === true && usePlugin.has('async-to-generator')) {
            context.report({
              node,
              message: 'Using async function is not allowed'
            })
          }
        },
        ArrowFunctionExpression (node) {
          if (node.async === true && usePlugin.has('async-to-generator')) {
            context.report({
              node,
              message: 'Using async arrow function is not allowed'
            })
          }
        },
        AwaitExpression (node) {
          if (usePlugin.has('async-to-generator') && usePlugin.has('regenerator-transform')) {
            context.report({
              node,
              message: 'Using await is not allowed'
            })
          }
        }
      }
    }
  }
}
