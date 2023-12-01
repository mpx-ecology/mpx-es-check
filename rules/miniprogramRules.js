module.exports = function (usePlugin) {
  return {
    meta: {
      docs: {
        description: 'miniprogram some check rules'
      }
    },
    create (context) {
      return {
        ObjectExpression (node) {
          if (node.properties && node.properties.length) {
            node.properties.forEach(property => {
              if (property.key.name === 'properties') {
                const compProperties = property.value.properties
                compProperties.forEach(compProperty => {
                  const compPropertyValue = compProperty.value
                  if (compPropertyValue.type === 'Identifier') {
                    /**
                     * // 当声明小程序属性为以下形式
                     * {
                     *   a: String
                     * }
                     */
                    if (!['String', 'Number', 'Boolean', 'Object', 'Array'].includes(compPropertyValue.name)) {
                      context.report({
                        node,
                        message: `There are some properties that are not supported by the earlier version of wechat miniprogram base library..... ${compProperty.key.name}`
                      })
                    }
                  } else if (compPropertyValue.type === 'ObjectExpression') {
                    /**
                     * // 当声明小程序属性为以下形式
                     * {
                     *   a: String
                     * }
                     */
                    if (compPropertyValue.properties && compPropertyValue.properties.length) {
                      let typeFlag = false
                      for (let per of compPropertyValue.properties) {
                        if (per.key.name === 'type') {
                          typeFlag = true
                          break
                        }
                      }
                      if (!typeFlag) {
                        // 属性赋值的对象中没有 type 字段，在低版本基础库会报错
                        context.report({
                          node,
                          message: `There are some properties that are not supported by the earlier version of wechat miniprogram base library..... ${compProperty.key.name}`
                        })
                      }
                    } else {
                      // 属性赋值一个空对象，在低版本基础库会报错
                      context.report({
                        node,
                        message: `There are some properties that are not supported by the earlier version of wechat miniprogram base library..... ${compProperty.key.name}`
                      })
                    }
                  } else if (compPropertyValue.type !== 'NullLiteral') {
                    // 当给属性赋值的非 Identifier、ObjectExpression、NullLiteral时，低版本基础库会报错
                    context.report({
                      node,
                      message: `There are some properties that are not supported by the earlier version of wechat miniprogram base library..... ${compProperty.key.name}`
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
