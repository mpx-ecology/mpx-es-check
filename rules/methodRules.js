
function resolvePropertyName(node, computed) {
  if (!computed) return node.name
  if (node.type === 'Literal') return node.value
  return node.value
  // const result = path.evaluate();
  // return result.value;
}

module.exports = {
  meta: {
    docs: {
      description: 'method rules'
    }
  },
  create (context) {
    return {
      /**
       * 处理实例方法
       * @param node
       * @constructor
       */
      MemberExpression (node) {

      },
      /**
       * 处理静态方法
       * @param node
       * @constructor
       */
      CallExpression (node) {
        const { callee } = node
        if (callee.type !== 'MemberExpression') return

        const { object } = callee
        const propertyName = resolvePropertyName(
          callee.property,
          callee.computed
        )
        console.log(propertyName);
      }

    }
  }
}
