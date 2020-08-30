module.exports = {
  meta: {
    docs: {
      description: 'ecma2020 rules'
    }
  },
  create (context) {
    return {
      CatchClause (node) {
        if (node.param === null) {
          context.report({
            node,
            message: 'Using CatchClause param is null is not allowed'
          })
        }
      }
    }
  }
}
