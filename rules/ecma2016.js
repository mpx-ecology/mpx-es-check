module.exports = {
    meta: {
        docs: {
            description: "ecma2016 rules",
        }
    },
    create(context) {
        return {
            // export {foo, bar}
            ExportNamedDeclaration(node) {
                context.report({
                    node,
                    message: `Using ExportNamedDeclaration is not allowed`
                })
            },
            ExportDefaultDeclaration(node) {
                context.report({
                    node,
                    message: `Using ExportDefaultDeclaration is not allowed`
                })
            },
            // export * from "mod"
            ExportAllDeclaration(node) {
                context.report({
                    node,
                    message: `Using ExportAllDeclaration is not allowed`
                })
            }
        }
    }
}
