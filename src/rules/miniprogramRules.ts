import type { Rule, ASTNode } from '../types'

export default function (): Rule {
  return {
    meta: {
      docs: {
        description: 'miniprogram some check rules'
      }
    },
    create (context) {
      return {
        ObjectExpression (node: ASTNode) {
          const properties = node.properties as Array<{
            key?: { name?: string }
            value?: ASTNode & { properties?: Array<{ key?: { name?: string }; value?: ASTNode & { properties?: Array<{ key?: { name?: string } }> } }> }
          }> | undefined

          if (properties && properties.length) {
            properties.forEach(property => {
              if (property.key && property.key.name === 'properties') {
                const compProperties = property.value?.properties
                if (!compProperties) return
                compProperties.forEach(compProperty => {
                  const compPropertyValue = compProperty.value
                  if (!compPropertyValue) return
                  if (compPropertyValue.type === 'Identifier') {
                    const identNode = compPropertyValue as { name?: string }
                    if (!['String', 'Number', 'Boolean', 'Object', 'Array', 'Function'].includes(identNode.name ?? '')) {
                      context.report({
                        node,
                        message: `There are some properties that are not supported by the earlier version of wechat miniprogram base library..... ${compProperty.key?.name ?? ''}`
                      })
                    }
                  } else if (compPropertyValue.type === 'ObjectExpression') {
                    const innerProps = compPropertyValue.properties
                    if (innerProps && innerProps.length) {
                      let typeFlag = false
                      for (const per of innerProps) {
                        if (per.key?.name === 'type') {
                          typeFlag = true
                          break
                        }
                      }
                      if (!typeFlag) {
                        context.report({
                          node,
                          message: `There are some properties that are not supported by the earlier version of wechat miniprogram base library..... ${compProperty.key?.name ?? ''}`
                        })
                      }
                    } else {
                      context.report({
                        node,
                        message: `There are some properties that are not supported by the earlier version of wechat miniprogram base library..... ${compProperty.key?.name ?? ''}`
                      })
                    }
                  } else if (compPropertyValue.type !== 'NullLiteral') {
                    context.report({
                      node,
                      message: `There are some properties that are not supported by the earlier version of wechat miniprogram base library..... ${compProperty.key?.name ?? ''}`
                    })
                  }
                })
              }
            })
          }
        }
      }
    }
  }
}
