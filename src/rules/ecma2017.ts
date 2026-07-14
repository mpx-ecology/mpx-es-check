import type { Rule, ASTNode } from '../types'

export default function (usePlugin: (name: string) => boolean): Rule {
  return {
    meta: {
      docs: {
        description: 'ecma2017 rules'
      }
    },
    create (context) {
      return {
        FunctionDeclaration (node: ASTNode) {
          if (node.async === true && usePlugin('async-to-generator')) {
            context.report({
              node,
              message: 'Using async function is not allowed'
            })
          }
        },
        ArrowFunctionExpression (node: ASTNode) {
          if (node.async === true && usePlugin('async-to-generator')) {
            context.report({
              node,
              message: 'Using async arrow function is not allowed'
            })
          }
        },
        AwaitExpression (node: ASTNode) {
          const arg = node.argument as { type?: string } | undefined
          if (arg?.type === 'CallExpression' && usePlugin('async-to-generator')) {
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
