import type { Rule, ASTNode } from '../types'

export default function (usePlugin: (name: string) => boolean): Rule {
  return {
    meta: {
      docs: {
        description: 'ecma2020 rules'
      }
    },
    create (context) {
      return {
        Literal (node: ASTNode) {
          if (node.bigint) {
            context.report({
              node,
              message: 'Using Literal value to represent BigInt literals such as 100n'
            })
          }
        },
        BigIntLiteral (node: ASTNode) {
          context.report({
            node,
            message: 'there has BigIntLiteral'
          })
        },
        OptionalMemberExpression (node: ASTNode) {
          if (usePlugin('optional-chaining')) {
            context.report({
              node,
              message: 'there has ChainExpression node，such as a?.b || a?.b.c || a.b?.c || a?.b?.c'
            })
          }
        },
        ChainExpression (node: ASTNode) {
          if (usePlugin('optional-chaining')) {
            context.report({
              node,
              message: 'there has ChainExpression node，such as a?.b || a?.b.c || a.b?.c || a?.b?.c'
            })
          }
        },
        ImportExpression (node: ASTNode) {
          if (usePlugin('modules-commonjs')) {
            context.report({
              node,
              message: 'there has ImportExpression node，such as var a = import("b")'
            })
          }
        },
        LogicalExpression (node: ASTNode) {
          if (node.operator === '??' && usePlugin('nullish-coalescing-operator')) {
            context.report({
              node,
              message: 'The operator property of the LogicalExpression node can be "??", such as var a = "1 ?? 2"'
            })
          }
        },
        MetaProperty (node: ASTNode) {
          context.report({
            node,
            message: 'Existing MetaProperty node represents import.meta meta property as well.'
          })
        },
        ExportAllDeclaration (node: ASTNode) {
          if (usePlugin('modules-commonjs')) {
            context.report({
              node,
              message: 'The exported property contains an Identifier when a different exported name is specified using as, e.g., export * as foo from "mod"'
            })
          }
        }
      }
    }
  }
}
