const { StaticProperties, InstanceProperties } = require('../lib/definitions')


function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function hasMapping(methods, name) {
  return has(methods, name)
}

function isNamespaced(path) {
  const binding = path.scope.getBinding(path.node.name)
  if (!binding) return false
  return binding.path.isImportNamespaceSpecifier()
}

function typeAnnotationToString(node) {
  switch (node.type) {
    case "GenericTypeAnnotation":
      if (node.id && node.id.type === 'Identifier' && node.id.name === 'Array') return 'array'
      break;
    case "StringTypeAnnotation":
      return "string";
  }
}

function maybeNeedsPolyfill (path, methods, name) {
  if (isNamespaced(path.get("object"))) return false
  if (!methods[name]) return true
  const typeAnnotation = path.get("object").getTypeAnnotation()
  const type = typeAnnotationToString(typeAnnotation)
  if (!type) return true;
  return methods[name].some((name) => {
    name.split('.').some(item => item === type)
  })
}

function resolvePropertyName (path, computed) {
  const { node } = path;
  if (!computed) return node.name;
  if (path.isStringLiteral()) return node.value;
  const result = path.evaluate();
  return result.value;
}
// 是否是静态方法
function hasStaticMapping(object, method) {
  return (
    has(StaticProperties, object) &&
    hasMapping(StaticProperties[object], method)
  );
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
      MemberExpression (node, path) {
        const { object } = node
        const propertyName = resolvePropertyName(
          path.get("property"),
          node.computed,
        )
        // 存在为转换的静态方法
        if (hasStaticMapping(object.name, propertyName)) {
          context.report({
            node,
            message: `there are static methods that are not converted..... ${object.name}.${propertyName}`
          })
        } else if (hasMapping(InstanceProperties, propertyName) && maybeNeedsPolyfill(path, InstanceProperties, propertyName)) {
          // 如果存在疑似为实例方法的数据
          context.report({
            node,
            message: `there are instance methods that are not converted..... ${object.name}.${propertyName}`,
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
        const { callee } = node
        if (callee.type !== 'MemberExpression') return

        const { object } = callee
        const propertyName = resolvePropertyName(
          path.get("callee.property"),
          callee.computed,
        )

        // 存在为转换的静态方法
        if (hasStaticMapping(object.name, propertyName)) {
          context.report({
            node,
            message: `there are static methods that are not converted..... ${object.name}.${propertyName}`
          })
        } else if (hasMapping(InstanceProperties, propertyName) && maybeNeedsPolyfill(path.get('callee'), InstanceProperties, propertyName)) {
          // 如果存在疑似为实例方法的数据
          context.report({
            node,
            message: `there are instance methods that are not converted..... ${object.name}.${propertyName}`,
            type: 'warning'
          })
        }
      }

    }
  }
}
