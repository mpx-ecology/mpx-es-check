import type { Rule, ASTNode } from '../types'

export default function (): Rule {
  return {
    meta: {
      docs: {
        description: 'Hermes engine unsupported syntax/API rules'
      }
    },
    create (context) {
      return {
        WithStatement (node: ASTNode) {
          context.report({
            node,
            message: 'Hermes does not support `with` statements.'
          })
        },
        MetaProperty (node: ASTNode) {
          const meta = node.meta as { name?: string } | undefined
          if (meta && meta.name === 'import') {
            context.report({
              node,
              message: 'Hermes does not support `import.meta`.'
            })
          }
        },
        MemberExpression (node: ASTNode) {
          const obj = node.object as { type?: string; name?: string } | undefined
          const prop = node.property as { name?: string } | undefined
          if (
            obj &&
            obj.type === 'Identifier' &&
            obj.name === 'Symbol' &&
            prop &&
            !node.computed
          ) {
            const propName = prop.name
            if (propName === 'species') {
              context.report({
                node,
                message: 'Hermes does not support `Symbol.species`.'
              })
            } else if (propName === 'unscopables') {
              context.report({
                node,
                message: 'Hermes does not support `Symbol.unscopables`.'
              })
            }
          }
        },
        CallExpression (node: ASTNode) {
          const callee = node.callee as { type?: string; object?: { type?: string; name?: string }; property?: { name?: string }; computed?: boolean } | undefined
          if (
            callee &&
            callee.type === 'MemberExpression' &&
            callee.object &&
            callee.object.type === 'Identifier' &&
            callee.property &&
            !callee.computed &&
            callee.property.name === 'groupBy'
          ) {
            const objName = callee.object.name
            if (objName === 'Object' || objName === 'Map') {
              context.report({
                node,
                message: `Hermes does not support \`${objName}.groupBy\`.`
              })
            }
          }
        }
      }
    }
  }
}
