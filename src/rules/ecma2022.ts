import type { Rule, ASTNode } from '../types'

export default function (usePlugin: (name: string) => boolean): Rule {
  return {
    meta: {
      docs: {
        description: 'ecma2022 rules https://github.com/estree/estree/blob/master/es2022.md'
      }
    },
    create (context) {
      return {
        PropertyDefinition (node: ASTNode) {
          const key = node.key as { type?: string } | undefined
          if (key?.type === 'PrivateIdentifier') {
            if (usePlugin('class-properties') && usePlugin('classes')) {
              context.report({
                node,
                message: 'using private variable in class is not allow'
              })
            }
          }
        },
        MethodDefinition (node: ASTNode) {
          if (!usePlugin('class-properties') || !usePlugin('classes')) return
          const handle: string[] = []
          if (node.kind === 'get' || node.kind === 'set') {
            handle.push(node.kind as string)
          }
          if (node.static === true && node.computed === false) {
            handle.push('static')
          }
          const key = node.key as { type?: string } | undefined
          if (key?.type === 'PrivateIdentifier') {
            handle.push('private')
          }
          if (handle.length) {
            context.report({
              node,
              message: `using ${handle.join(' ')} in class is not allow`
            })
          }
        },
        AwaitExpression (node: ASTNode) {
          const arg = node.argument as { type?: string } | undefined
          if (arg?.type === 'ImportExpression' && usePlugin('modules-commonjs')) {
            context.report({
              node,
              message: 'using await import("./xxx") is not allow'
            })
          }
        },
        regex (node: ASTNode) {
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
