import type { Rule, ASTNode } from '../types'

export default function (usePlugin: (name: string) => boolean): Rule {
  return {
    meta: {
      docs: {
        description: 'ecma2016 rules'
      }
    },
    create (context) {
      return {
        BinaryExpression (node: ASTNode) {
          if (node.operator === '**' && usePlugin('exponentiation-operator')) {
            context.report({
              node,
              message: 'Using BinaryExpression operator ** is not allowed'
            })
          }
        },
        AssignmentExpression (node: ASTNode) {
          if (node.operator === '**=' && usePlugin('exponentiation-operator')) {
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
