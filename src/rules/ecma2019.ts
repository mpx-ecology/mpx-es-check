import type { Rule, ASTNode } from '../types'

export default function (usePlugin: (name: string) => boolean): Rule {
  return {
    meta: {
      docs: {
        description: 'ecma2019 rules'
      }
    },
    create (context) {
      return {
        CatchClause (node: ASTNode) {
          if (node.param === null && usePlugin('optional-catch-binding')) {
            context.report({
              node,
              message: 'Using CatchClause param is null is not allowed, E.g., try { foo() } catch { bar() }'
            })
          }
        }
      }
    }
  }
}
