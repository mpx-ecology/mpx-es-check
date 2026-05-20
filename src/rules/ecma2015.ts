import type { Rule, ASTNode } from '../types'

export default function (usePlugin: (name: string) => boolean): Rule {
  return {
    meta: {
      docs: {
        description: 'ecma2015 rules'
      }
    },
    create (context) {
      return {
        VariableDeclaration (node: ASTNode) {
          if (node.kind === 'let' || node.kind === 'const') {
            if (usePlugin('block-scoping')) {
              context.report({
                node,
                loc: { start: node.start, end: node.end },
                message: `Using ${node.kind as string} is not allowed`
              })
            }
          }
        },
        FunctionDeclaration (node: ASTNode) {
          if (node.generator === true) {
            if (usePlugin('regenerator-transform')) {
              context.report({
                node,
                message: 'Using generator function is not allowed'
              })
            }
          }
        },
        ForOfStatement (node: ASTNode) {
          if (node.type === 'ForOfStatement') {
            if (usePlugin('for-of')) {
              context.report({
                node,
                message: 'Using for...of is not allowed'
              })
            }
          }
        },
        Super (node: ASTNode, path: unknown) {
          if (node.type === 'Super') {
            const p = path as { parent?: { type?: string } }
            if ((p.parent?.type === 'CallExpression' || p.parent?.type === 'MemberExpression') && usePlugin('classes')) {
              context.report({
                node,
                message: 'Using Super is not allowed'
              })
            }
          }
        },
        SpreadElement (node: ASTNode, path: unknown) {
          const p = path as { parent?: { type?: string } }
          const parentType = p.parent?.type
          if ((parentType === 'ArrayExpression' || parentType === 'CallExpression' || parentType === 'NewExpression') && usePlugin('spread')) {
            context.report({
              node,
              message: 'Using SpreadElement(解构语法) is not allowed'
            })
          }
        },
        ArrowFunctionExpression (node: ASTNode) {
          if (usePlugin('arrow-functions')) {
            context.report({
              node,
              message: 'Using ArrowFunction(箭头函数) is not allowed'
            })
          }
        },
        YieldExpression (node: ASTNode) {
          if (usePlugin('async-generator-functions')) {
            context.report({
              node,
              message: 'Using YieldExpression is not allowed'
            })
          }
        },
        TemplateLiteral (node: ASTNode) {
          if (usePlugin('template-literals')) {
            context.report({
              node,
              message: 'Using TemplateLiteral(模版语法) is not allowed'
            })
          }
        },
        TaggedTemplateExpression (node: ASTNode) {
          if (usePlugin('template-literals')) {
            context.report({
              node,
              message: 'Using TaggedTemplateExpression(标签模版字符串) is not allowed'
            })
          }
        },
        ObjectPattern (node: ASTNode, path: unknown) {
          const p = path as { parent?: { kind?: string } }
          if (p.parent?.kind === 'init' && usePlugin('object-rest-spread')) {
            context.report({
              node,
              message: 'Using ObjectPattern(初始化赋值) is not allowed'
            })
          }
        },
        ArrayPattern (node: ASTNode, path: unknown) {
          const p = path as { parent?: { kind?: string } }
          if (p.parent?.kind === 'init' && usePlugin('spread')) {
            context.report({
              node,
              message: 'Using ArrayPattern(初始化赋值) is not allowed'
            })
          }
        },
        RestElement (node: ASTNode) {
          if (usePlugin('destructuring')) {
            context.report({
              node,
              message: 'Using RestElement(解构初始化赋值) is not allowed'
            })
          }
        },
        AssignmentPattern (node: ASTNode) {
          if (usePlugin('parameters')) {
            context.report({
              node,
              message: 'Using AssignmentPattern(表达式初始化赋值) function a(b = 1) {} is not allowed'
            })
          }
        },
        ClassBody (node: ASTNode) {
          if (usePlugin('classes')) {
            context.report({
              node,
              message: 'Using ClassBody is not allowed'
            })
          }
        },
        MethodDefinition (node: ASTNode) {
          const key = node.key as { type?: string } | undefined
          if (key?.type === 'Identifier' && usePlugin('classes')) {
            context.report({
              node,
              message: 'Using MethodDefinition(class 方法) is not allowed'
            })
          }
        },
        ClassDeclaration (node: ASTNode) {
          if (usePlugin('classes')) {
            context.report({
              node,
              message: 'Using class 声明 is not allowed'
            })
          }
        },
        ClassExpression (node: ASTNode) {
          if (usePlugin('classes')) {
            context.report({
              node,
              message: 'Using class 表达式 is not allowed'
            })
          }
        },
        MetaProperty (node: ASTNode) {
          if (usePlugin('new-target')) {
            context.report({
              node,
              message: 'Using MetaProperty(new.target()) is not allowed'
            })
          }
        },
        ImportDeclaration (node: ASTNode) {
          if (usePlugin('modules-commonjs')) {
            context.report({
              node,
              message: 'Using ImportDeclaration is not allowed'
            })
          }
        },
        ExportNamedDeclaration (node: ASTNode) {
          if (usePlugin('modules-commonjs')) {
            context.report({
              node,
              message: 'Using ExportNamedDeclaration is not allowed'
            })
          }
        },
        ExportDefaultDeclaration (node: ASTNode) {
          if (usePlugin('modules-commonjs')) {
            context.report({
              node,
              message: 'Using ExportDefaultDeclaration is not allowed'
            })
          }
        },
        ExportAllDeclaration (node: ASTNode) {
          if (usePlugin('modules-commonjs')) {
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
