module.exports = {
  meta: {
    docs: {
      description: "ecma2015 rules",
    }
  },
  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind === 'let' || node.kind === 'const') {
          context.report({
            node,
            loc: {start: node.start, end: node.end},
            message: `Using ${node.kind} is not allowed`
          })
        }
      },
      FunctionDeclaration(node) {
        if (node.generator === true) {
          context.report({
            node,
            message: `Using generator function is not allowed`
          })
        }
      },
      ForOfStatement(node) {
        if (node.type === 'ForOfStatement') {
          context.report({
            node,
            message: `Using for...of is not allowed`
          })
        }
      },
      // class 中 Super 的使用
      Super(node) {
        if (node.type === 'Super') {
          if (node.parent.type === 'CallExpression' || node.parent.type === 'MemberExpression') {
            context.report({
              node,
              message: `Using Super is not allowed`
            })
          }
        }
      },
      // 解构赋值
      SpreadElement(node) {
        const parentType = node.parent.type
        if (parentType === 'ArrayExpression' || parentType === 'CallExpression' || parentType === 'NewExpression') {
          context.report({
            node,
            message: `Using SpreadElement(解构语法) is not allowed`
          })
        }
      },
      // 箭头函数
      ArrowFunctionExpression(node) {
        context.report({
          node,
          message: `Using ArrowFunction(箭头函数) is not allowed`
        })
      },
      // yield 表达式
      YieldExpression(node) {
        context.report({
          node,
          message: `Using YieldExpression is not allowed`
        })
      },
      // 模版文字
      TemplateLiteral(node) {
        context.report({
          node,
          message: `Using TemplateLiteral(模版语法) is not allowed`
        })
      },
      // 标签模版语法字符串 flag
      TaggedTemplateExpression(node) {
        context.report({
          node,
          message: `Using TaggedTemplateExpression(标签模版字符串) is not allowed`
        })
      },
      // 对象赋值模式
      ObjectPattern(node) {
        if (node.parent.kind === 'init') {
          context.report({
            node,
            message: `Using ObjectPattern(初始化赋值) is not allowed`
          })
        }
      },
      // 数组赋值模式
      ArrayPattern(node) {
        if (node.parent.kind === 'init') {
          context.report({
            node,
            message: `Using ArrayPattern(初始化赋值) is not allowed`
          })
        }
      },
      // 解构初始化赋值
      RestElement(node) {
        context.report({
          node,
          message: `Using RestElement(解构初始化赋值) is not allowed`
        })
      },
      // 表达式初始化赋值
      // a=1+2
      AssignmentPattern(node) {
        context.report({
          node,
          message: `Using AssignmentPattern(表达式初始化赋值) is not allowed`
        })
      },
      // class body 检测
      ClassBody(node) {
        context.report({
          node,
          message: `Using ClassBody is not allowed`
        })
      },
      // class body method
      MethodDefinition(node) {
        context.report({
          node,
          message: `Using MethodDefinition(class 方法) is not allowed`
        })
      },
      ClassDeclaration(node) {
        context.report({
          node,
          message: `Using class 声明 is not allowed`
        })
      },
      ClassExpression(node) {
        context.report({
          node,
          message: `Using class 表达式 is not allowed`
        })
      },
      MetaProperty(node) {
        context.report({
          node,
          message: `Using MetaProperty(new.target()) is not allowed`
        })
      },
      // ---Modules---
      ImportDeclaration(node) {
        context.report({
          node,
          message: `Using ImportDeclaration is not allowed`
        })
      },
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
