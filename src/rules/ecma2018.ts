import type { Rule, ASTNode } from '../types'

export default function (usePlugin: (name: string) => boolean): Rule {
  return {
    meta: {
      docs: {
        description: 'ecma2018 rules'
      }
    },
    create (context) {
      return {
        ForOfStatement (node: ASTNode) {
          if (node.await === true && usePlugin('async-generator-functions')) {
            context.report({
              node,
              message: 'Using for_await_of is not allowed'
            })
          }
        },
        ObjectExpression (node: ASTNode) {
          const properties = node.properties as Array<{ type: string }> | undefined
          if (properties && properties.length) {
            let hasSpreadElement = false
            for (const property of properties) {
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
        TemplateElement (node: ASTNode) {
          const value = node.value as { cooked?: unknown } | undefined
          if (value && value.cooked === null && usePlugin('template-literals')) {
            context.report({
              node,
              message: 'Using TemplateElement has cooked null is not allowed'
            })
          }
        },
        ObjectPattern (node: ASTNode) {
          const properties = node.properties as Array<{ type: string }> | undefined
          if (properties && properties.length) {
            let hasRestElement = false
            for (const property of properties) {
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
