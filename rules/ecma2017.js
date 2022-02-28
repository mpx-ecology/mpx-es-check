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
          if (node.argument.type === 'CallExpression' && usePlugin.has('async-to-generator')) {
            context.report({
              node,
              message: 'Using await xxx() is not allowed'
            })
          }
        }
      }
    }
  }
}
