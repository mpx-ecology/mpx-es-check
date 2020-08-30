module.exports = {
  meta: {
    docs: {
      description: "ecma2018 rules",
    }
  },
  create(context) {
    return {
      ForOfStatement(node) {
        context.report({
          node,
          message: `Using ForOfStatement is not allowed`
        })
      },
      ObjectExpression(node) {
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
          if (hasSpreadElement) {
            context.report({
              node,
              message: `Using hasSpreadElement in ObjectExpression is not allowed`
            })
          }
        }
      },
      TemplateElement(node) {
        if (node.value && node.value.cooked === null) {
          context.report({
            node,
            message: `Using TemplateElement has cooked null is not allowed`
          })
        }
      },
      ObjectPattern(node) {
        if (node.properties && node.properties.length) {
          let hasRestElement = false
          for (const property of node.properties) {
            if (property.type === 'hasRestElement') {
              hasRestElement = true
            }
          }
          if (hasRestElement) {
            context.report({
              node,
              message: `Using RestElement in ObjectPattern is not allowed`
            })
          }
        }
      }
    }
  }
}
