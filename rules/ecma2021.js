module.exports = {
  meta: {
    docs: {
      description: 'ecma2021 rules'
    }
  },
  create (context) {
    return {
      /**
       * AssignmentExpression node has short-circuiting behavior if the operator property is any of "||=","&&=", and "??=".
       * @param node
       * @constructor
       */
      AssignmentExpression (node) {
        if (node.operator === '||=' || node.operator === '??=' || node.operator === '&&=') {
          context.report({
            node,
            message: `使用的赋值运算符 ${node.operator} 浏览器咱不支持，需要走 babel 转译`
          })
        }
      }
    }
  }
}
