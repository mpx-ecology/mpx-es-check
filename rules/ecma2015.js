module.exports = function (usePlugin) {
  return {
    meta: {
      docs: {
        description: 'ecma2015 rules'
      }
    },
    create (context) {
      return {
        VariableDeclaration (node) {
          if (node.kind === 'let' || node.kind === 'const') {
            if (usePlugin.has('block-scoping')) {
              context.report({
                node,
                loc: { start: node.start, end: node.end },
                message: `Using ${node.kind} is not allowed`
              })
            }
          }
        },
        FunctionDeclaration (node) {
          if (node.generator === true) {
            if (usePlugin.has('regenerator-transform')) {
              context.report({
                node,
                message: 'Using generator function is not allowed'
              })
            }
          }
        },
        ForOfStatement (node) {
          if (node.type === 'ForOfStatement') {
            if (usePlugin.has('for-of')) {
              context.report({
                node,
                message: 'Using for...of is not allowed'
              })
            }
          }
        },
        // class 中 Super 的使用
        Super (node, path) {
          if (node.type === 'Super') {
            if ((path.parent.type === 'CallExpression' || path.parent.type === 'MemberExpression') && usePlugin.has('classes')) {
              context.report({
                node,
                message: 'Using Super is not allowed'
              })
            }
          }
        },
        // 解构赋值
        SpreadElement (node, path) {
          const parentType = path.parent.type
          if ((parentType === 'ArrayExpression' || parentType === 'CallExpression' || parentType === 'NewExpression') && usePlugin.has('spread')) {
            context.report({
              node,
              message: 'Using SpreadElement(解构语法) is not allowed'
            })
          }
        },
        // 箭头函数
        ArrowFunctionExpression (node) {
          if (usePlugin.has('arrow-functions')) {
            context.report({
              node,
              message: 'Using ArrowFunction(箭头函数) is not allowed'
            })
          }
        },
        // yield 表达式
        YieldExpression (node) {
          if (usePlugin.has('async-generator-functions')) {
            context.report({
              node,
              message: 'Using YieldExpression is not allowed'
            })
          }
        },
        // 模版文字
        TemplateLiteral (node) {
          if (usePlugin.has('template-literals')) {
            context.report({
              node,
              message: 'Using TemplateLiteral(模版语法) is not allowed'
            })
          }
        },
        // 标签模版语法字符串 flag
        TaggedTemplateExpression (node) {
          if (usePlugin.has('template-literals')) {
            context.report({
              node,
              message: 'Using TaggedTemplateExpression(标签模版字符串) is not allowed'
            })
          }
        },
        // 对象赋值模式
        ObjectPattern (node, path) {
          if (path.parent.kind === 'init' && usePlugin.has('object-rest-spread')) {
            context.report({
              node,
              message: 'Using ObjectPattern(初始化赋值) is not allowed'
            })
          }
        },
        // 数组赋值模式
        ArrayPattern (node, path) {
          if (path.parent.kind === 'init' && usePlugin.has('spread')) {
            context.report({
              node,
              message: 'Using ArrayPattern(初始化赋值) is not allowed'
            })
          }
        },
        // 解构初始化赋值 [a, ...rest] = [10, 20, 30, 40, 50]
        RestElement (node) {
          if (usePlugin.has('destructuring')) {
            context.report({
              node,
              message: 'Using RestElement(解构初始化赋值) is not allowed'
            })
          }
        },
        // 表达式初始化赋值 function a(b = 1) {}
        AssignmentPattern (node) {
          if (usePlugin.has('parameters')) {
            context.report({
              node,
              message: 'Using AssignmentPattern(表达式初始化赋值) function a(b = 1) {} is not allowed'
            })
          }
        },
        // class body 检测
        ClassBody (node) {
          if (usePlugin.has('classes')) {
            context.report({
              node,
              message: 'Using ClassBody is not allowed'
            })
          }
        },
        // class body method
        MethodDefinition (node) {
          if (usePlugin.has('classes')) {
            context.report({
              node,
              message: 'Using MethodDefinition(class 方法) is not allowed'
            })
          }
        },
        ClassDeclaration (node) {
          if (usePlugin.has('classes')) {
            context.report({
              node,
              message: 'Using class 声明 is not allowed'
            })
          }
        },
        ClassExpression (node) {
          if (usePlugin.has('classes')) {
            context.report({
              node,
              message: 'Using class 表达式 is not allowed'
            })
          }
        },
        MetaProperty (node) {
          if (usePlugin.has('new-target')) {
            context.report({
              node,
              message: 'Using MetaProperty(new.target()) is not allowed'
            })
          }
        },
        // ---Modules---
        ImportDeclaration (node) {
          if (usePlugin.has('modules-commonjs')) {
            context.report({
              node,
              message: 'Using ImportDeclaration is not allowed'
            })
          }
        },
        // export {foo, bar}
        ExportNamedDeclaration (node) {
          if (usePlugin.has('modules-commonjs')) {
            context.report({
              node,
              message: 'Using ExportNamedDeclaration is not allowed'
            })
          }
        },
        // export default function () {}
        ExportDefaultDeclaration (node) {
          if (usePlugin.has('modules-commonjs')) {
            context.report({
              node,
              message: 'Using ExportDefaultDeclaration is not allowed'
            })
          }
        },
        // export * from "mod"
        ExportAllDeclaration (node) {
          if (usePlugin.has('modules-commonjs')) {
            context.report({
              node,
              message: 'Using ExportAllDeclaration is not allowed'
            })
          }
        }
      }
    }
  }
}
