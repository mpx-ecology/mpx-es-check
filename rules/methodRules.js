const { StaticProperties, InstanceProperties, BuiltIns } = require('../lib/definitions')

function has (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function hasMapping (methods, name) {
  return has(methods, name)
}

function isNamespaced (path) {
  const binding = path.scope.getBinding(path.node.name)
  if (!binding) return false
  return binding.path.isImportNamespaceSpecifier()
}

function typeAnnotationToString (node) {
  switch (node.type) {
    case 'GenericTypeAnnotation':
      if (node.id && node.id.type === 'Identifier' && node.id.name === 'Array') return 'array'
      break
    case 'StringTypeAnnotation':
      return 'string'
  }
}

function maybeNeedsPolyfill (path, methods, name) {
  if (isNamespaced(path.get('object'))) return false
  if (!methods[name]) return true
  const typeAnnotation = path.get('object').getTypeAnnotation()
  const type = typeAnnotationToString(typeAnnotation)
  if (!type) return true
  return methods[name].some((name) => {
    return name.split('.').some(item => item === type)
  })
}

function resolvePropertyName (path, computed) {
  const { node } = path
  if (!computed) return node.name
  if (path.isStringLiteral()) return node.value
  const result = path.evaluate()
  return result.value
}
// 是否是静态方法
function hasStaticMapping (object, method) {
  return (
    has(StaticProperties, object) &&
    hasMapping(StaticProperties[object], method)
  )
}

module.exports = {
  meta: {
    docs: {
      description: 'method rules'
    }
  },
  create (context) {
    return {
      /**
       * 处理方法
       * @param node
       * @constructor
       */
      ReferencedIdentifier (node) {
        const { name } = node
        if (name === 'regeneratorRuntime') {
          context.report({
            node,
            message: '存在 generator 方法未被转换 ',
            type: 'warning'
          })
          return
        }
        if (hasMapping(BuiltIns, name)) {
          context.report({
            node,
            message: `there are builtIns object that are not converted: ${name}`,
            type: 'warning'
          })
        }
      },
      /**
       * 处理方法
       * @param node
       * @constructor
       */
      CallExpression (node, path) {
        const callee = path.node.callee
        const memberExpressionCallee = path.get('callee')
        if (callee.type !== 'MemberExpression') return
        const { object } = callee
        const propertyName = resolvePropertyName(
          path.get('callee.property'),
          callee.computed
        )

        // 存在为转换的静态方法
        if (hasStaticMapping(object.name, propertyName)) {
          if (path.parent && path.parent.type === 'IfStatement') {
            // 如果是 if 语句判断条件中: if (Object.getOwnPropertySymbols)
            // 则认为是正常的 polyfill 代码块
            return true
          }
          if (path.scope.path.container.type === 'IfStatement') {
            const proName = path.scope.path.container.test.property && path.scope.path.container.test.property.name
            const objName = path.scope.path.container.test.object && path.scope.path.container.test.object.name
            if (hasStaticMapping(objName, proName)) {
              // 如果当前的 static method 是存在与判空 if 语句中的
              return true
            }
          }
          context.report({
            node,
            message: `there are static methods that are not converted..... ${object.name}.${propertyName}`
          })
        } else if (hasMapping(InstanceProperties, propertyName) && maybeNeedsPolyfill(memberExpressionCallee, InstanceProperties, propertyName)) {
          // 如果存在疑似为实例方法的数据
          context.report({
            node,
            message: `there are instance methods that are not converted: ${object.name}.${propertyName}`,
            type: 'warning'
          })
        } else if (hasMapping(BuiltIns, object.name)) {
          // 如果存在疑似为内建方法的数据
          context.report({
            node,
            message: `there are builtIns object that are not converted..... ${object.name}`,
            type: 'warning'
          })
        }
      }
    }
  }
}
