module.exports = function (usePlugin) {
  return {
    meta: {
      docs: {
        description: 'ecma2022 rules https://github.com/estree/estree/blob/master/es2022.md'
      }
    },
    create (context) {
      return {
        // class 私有属性/方法
        PropertyDefinition (node) {
          if (node.key.type === 'PrivateIdentifier') {
            if (usePlugin('class-properties') && usePlugin('classes')) {
              context.report({
                node,
                message: 'using private variable in class is not allow'
              })
            }
          }
        },
        MethodDefinition (node) {
          if (!usePlugin('class-properties') || !usePlugin('classes')) return
          const handle = []
          if (node.kind === 'get' || node.kind === 'set') {
            handle.push(node.kind)
          }
          if (node.static === true && node.computed === false) { // class 静态方法
            handle.push('static')
          }
          if (node.key.type === 'PrivateIdentifier') { // class 私有方法
            handle.push('private')
          }
          if (handle.length) {
            context.report({
              node,
              message: `using ${handle.join(' ')} in class is not allow`
            })
          }
        },
        AwaitExpression (node) {
          // await import ('/xxx')
          if (node.argument.type === 'ImportExpression' && usePlugin('modules-commonjs')) {
            context.report({
              node,
              message: 'using await import("./xxx") is not allow'
            })
          }
        },
        regex (node) {
          if (node.flags === 'd') {
            context.report({
              node,
              message: 'using regex /d is not allow'
            })
          }
        }
      }
    }
  }
}
