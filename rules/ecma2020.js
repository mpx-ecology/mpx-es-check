module.exports = {
  meta: {
    docs: {
      description: "ecma2020 rules",
    }
  },
  create(context) {
    return {
      Literal(node) {
        let message = ''
        if (node.bigint && node.value) {
          message: `Using Literal value is bigint is null is not allowed`
        } else if (node.bigint && node.value === null) {
          message = `Using Literal value is bigint and in environments that don't support BigInt values is null is not allowed`
        }
        context.report({
          node,
          message: message
        })
      },
    }
  }
}
