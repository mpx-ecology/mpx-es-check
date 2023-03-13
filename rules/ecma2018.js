module.exports = function (usePlugin) {
  return {
    meta: {
      docs: {
        description: 'ecma2018 rules'
      }
    },
    create (context) {
      return {
        ForOfStatement (node) {
          if (node.await === true && usePlugin('async-generator-functions')) {
            context.report({
              node,
              message: 'Using for_await_of is not allowed'
            })
          }
        },
        // {a: 1, ...obj, b: 2}
        ObjectExpression (node) {
          /**
           * extend interface ObjectExpression {
              properties: [ Property | SpreadElement ];
          }
           */
          if (node.properties && node.properties.length) {
            let hasSpreadElement = false
            for (const property of node.properties) {
              if (property.type === 'SpreadElement') {
                hasSpreadElement = true
              }
            }
            if (hasSpreadElement && usePlugin('object-rest-spread')) {
              context.report({
                node,
                message: 'Using hasSpreadElement in ObjectExpression is not allowed'
              })
            }
          }
        },
        TemplateElement (node) {
          if (node.value && node.value.cooked === null && usePlugin('template-literals')) {
            context.report({
              node,
              message: 'Using TemplateElement has cooked null is not allowed'
            })
          }
        },
        // {a, ...rest} = obj
        ObjectPattern (node) {
          if (node.properties && node.properties.length) {
            let hasRestElement = false
            for (const property of node.properties) {
              if (property.type === 'hasRestElement') {
                hasRestElement = true
              }
            }
            if (hasRestElement && usePlugin('destructuring')) {
              context.report({
                node,
                message: 'Using RestElement in ObjectPattern is not allowed'
              })
            }
          }
        }
      }
    }
  }
}
