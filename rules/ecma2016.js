module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "disallow the use of `debugger`",
            category: "Possible Errors",
            recommended: true,
            url: "https://eslint.org/docs/rules/no-debugger"
        },

        fixable: null,
        schema: [],

        messages: {
            unexpected: "Unexpected 'debugger' statement."
        }
    },

    create(context) {
        return {
            DebuggerStatement(node) {
                // context.report({
                //     node,
                //     messageId: "unexpected"
                // });
            }
        };

    }
};
