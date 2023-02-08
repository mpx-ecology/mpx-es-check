module.exports = {
  meta: {
    docs: {
      description: 'custom rules'
    }
  },
  create (context) {
    return {
      // getApp().commonStore
      CallExpression (node, path) {
        if (!path.parent || !path.parent.property || !path.parent.property.name) return;
        if (path.parent.property.name === 'commonStore') {
          context.report({
            type: 'warning',
            node,
            message: 'using getApp().commonStore is not allowed'
          })
        }
      },
      // let xx= getApp()  xx.commonStore
      MemberExpression (node) {
        if (node.property.name === 'commonStore') {
          context.report({
            type: 'warning',
            node,
            message: 'using *.commonStore is not allowed'
          })
        }
      }
    }
  }
}
