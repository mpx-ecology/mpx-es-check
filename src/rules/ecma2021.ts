import type { Rule, ASTNode } from '../types'

export default function (usePlugin: (name: string) => boolean): Rule {
  return {
    meta: {
      docs: {
        description: 'ecma2021 rules'
      }
    },
    create (context) {
      return {
        AssignmentExpression (node: ASTNode) {
          if (node.operator === '||=' || node.operator === '??=' || node.operator === '&&=') {
            if (usePlugin('logical-assignment-operators')) {
              context.report({
                node,
                message: `使用的赋值运算符 ${node.operator as string} 浏览器暂不支持，需要走 babel 转译`
              })
            }
          }
        }
      }
    }
  }
}
