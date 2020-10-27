module.exports = {
  meta: {
    docs: {
      description: 'ecma2020 rules'
    }
  },
  create (context) {
    return {
      /**
       * 赋值的value 为 bigint 类型
       * @param node
       * @constructor
       */
      Literal (node) {
        if (node.bigint) {
          context.report({
            node,
            message: 'Using Literal value to represent BigInt literals such as 100n'
          })
        }
      },
      BigIntLiteral (node) {
        context.report({
          node,
          message: 'there has BigIntLiteral'
        })
      },
      /**
       * 当出现 optional 语法时，例如：a?.b || a?.b.c || a.b?.c || a?.b?.c
       * @param node
       * @constructor
       */
      ChainExpression (node) {
        context.report({
          node,
          message: 'there has ChainExpression node，such as a?.b || a?.b.c || a.b?.c || a?.b?.c'
        })
      },
      /**
       * import 表达式 例如：var a = import('b')
       * @param node
       * @constructor
       */
      ImportExpression (node) {
        context.report({
          node,
          message: 'there has ImportExpression node，such as var a = import("b")'
        })
      },
      /**
       * The operator property of the LogicalExpression node can be "??" to represent Nullish Coalescing syntax.
       * @param node
       * @constructor
       */
      LogicalExpression (node) {
        if (node.operator === '??') {
          context.report({
            node,
            message: 'The operator property of the LogicalExpression node can be "??", such as var a = "1 ?? 2"'
          })
        }
      },
      /**
       * Existing MetaProperty node represents import.meta meta property as well.
       * @param node
       * @constructor
       */
      MetaProperty (node) {
        context.report({
          node,
          message: 'Existing MetaProperty node represents import.meta meta property as well.'
        })
      },
      /**
       * The exported property contains an Identifier when a different exported name is specified using as, e.g., export * as foo from "mod"
       * @param node
       * @constructor
       */
      ExportAllDeclaration (node) {
        context.report({
          node,
          message: 'The exported property contains an Identifier when a different exported name is specified using as, e.g., export * as foo from "mod"'
        })
      }
    }
  }
}
