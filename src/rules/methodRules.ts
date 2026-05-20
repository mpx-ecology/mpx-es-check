import { StaticProperties, InstanceProperties, BuiltIns } from '../lib/definitions'
import type { Rule, ASTNode } from '../types'

function has (obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function hasMapping (methods: Record<string, unknown>, name: string): boolean {
  return has(methods, name)
}

function isNamespaced (path: unknown): boolean {
  const p = path as { scope?: { getBinding?: (name: string) => { path?: { isImportNamespaceSpecifier?: () => boolean } } | null }; node?: { name?: string } }
  const binding = p.scope?.getBinding?.(p.node?.name ?? '')
  if (!binding) return false
  return !!(binding.path?.isImportNamespaceSpecifier?.())
}

function typeAnnotationToString (node: ASTNode): string | undefined {
  switch (node.type) {
    case 'GenericTypeAnnotation': {
      const id = node.id as { type?: string; name?: string } | undefined
      if (id && id.type === 'Identifier' && id.name === 'Array') return 'array'
      break
    }
    case 'StringTypeAnnotation':
      return 'string'
  }
  return undefined
}

function maybeNeedsPolyfill (path: unknown, methods: Record<string, string[]>, name: string): boolean {
  const p = path as { get?: (key: string) => unknown }
  if (isNamespaced(p.get?.('object'))) return false
  if (!methods[name]) return true
  const typeAnnotationPath = p.get?.('object') as { getTypeAnnotation?: () => ASTNode }
  const typeAnnotation = typeAnnotationPath?.getTypeAnnotation?.()
  if (!typeAnnotation) return true
  const type = typeAnnotationToString(typeAnnotation)
  if (!type) return true
  return methods[name].some((n: string) => {
    return n.split('.').some(item => item === type)
  })
}

function resolvePropertyName (path: unknown, computed: boolean): string | undefined {
  const p = path as { node?: { name?: string; value?: string }; isStringLiteral?: () => boolean; evaluate?: () => { value?: string } }
  const node = p.node
  if (!computed) return node?.name
  if (p.isStringLiteral?.()) return node?.value
  const result = p.evaluate?.()
  return result?.value
}

function hasStaticMapping (filedStaticPros: Record<string, Record<string, unknown>>, object: string, method: string): boolean {
  return (
    has(filedStaticPros as Record<string, unknown>, object) &&
    hasMapping(filedStaticPros[object], method)
  )
}

function filterData<T extends Record<string, unknown>> (target: T, list: string[]): Record<string, unknown> {
  const filtered: Record<string, unknown> = {}
  Object.keys(target).forEach(key => {
    const val = target[key]
    if (Array.isArray(val)) {
      const temp: string[] = []
      val.forEach((item: string) => {
        if (list.includes(item)) {
          temp.push(item)
        }
      })
      if (temp.length) {
        filtered[key] = temp
      }
    } else {
      filtered[key] = {}
      const nested = val as Record<string, string | string[]>
      Object.keys(nested).forEach(item => {
        const res = nested[item]
        if (typeof res === 'string') {
          if (list.includes(res)) {
            (filtered[key] as Record<string, unknown>)[item] = res
          }
        } else {
          const temp: string[] = []
          res.forEach((sub: string) => {
            if (list.includes(sub)) {
              temp.push(sub)
            }
          })
          if (temp.length) {
            (filtered[key] as Record<string, unknown>)[item] = [...temp]
          }
        }
      })
    }
  })
  return filtered
}

export default function (list: string[] = []): Rule {
  const filteredInstancePros = filterData(InstanceProperties, list) as Record<string, string[]>
  const filteredStaticPros = filterData(StaticProperties, list) as Record<string, Record<string, unknown>>
  const filedBuiltIns = filterData(BuiltIns, list) as Record<string, string[]>

  return {
    meta: {
      docs: {
        description: 'method rules'
      }
    },
    create (context) {
      return {
        ReferencedIdentifier (node: ASTNode) {
          const { name } = node as unknown as { name: string }
          if (name === 'regeneratorRuntime') {
            context.report({
              node,
              message: '存在 generator 方法未被转换 ',
              type: 'warning'
            })
            return
          }
          if (hasMapping(filedBuiltIns, name)) {
            context.report({
              node,
              message: `there are builtIns object that are not converted: ${name}`,
              type: 'warning'
            })
          }
        },
        CallExpression (node: ASTNode, path: unknown) {
          const p = path as {
            node?: { callee?: { type?: string; object?: { name?: string }; computed?: boolean } }
            get?: (key: string) => unknown
            parent?: { type?: string }
            scope?: { path?: { container?: { type?: string; test?: { property?: { name?: string }; object?: { name?: string } } } } }
          }
          const callee = p.node?.callee as { type?: string; object?: { name?: string }; computed?: boolean } | undefined
          const memberExpressionCallee = p.get?.('callee')
          if (callee?.type !== 'MemberExpression') return
          const object = callee.object
          const propertyName = resolvePropertyName(
            p.get?.('callee.property'),
            callee.computed ?? false
          )

          if (propertyName !== undefined && hasStaticMapping(filteredStaticPros, object?.name ?? '', propertyName)) {
            if (p.parent && p.parent.type === 'IfStatement') {
              return
            }
            if (p.scope?.path?.container?.type === 'IfStatement') {
              const proName = p.scope.path.container.test?.property?.name
              const objName = p.scope.path.container.test?.object?.name
              if (proName && objName && hasStaticMapping(filteredStaticPros, objName, proName)) {
                return
              }
            }
            context.report({
              node,
              message: `there are static methods that are not converted..... ${object?.name}.${propertyName}`
            })
          } else if (
            propertyName !== undefined &&
            hasMapping(filteredInstancePros, propertyName) &&
            maybeNeedsPolyfill(memberExpressionCallee, filteredInstancePros, propertyName)
          ) {
            context.report({
              node,
              message: `there are instance methods that are not converted: ${object?.name}.${propertyName}`,
              type: 'warning'
            })
          } else if (object?.name && hasMapping(filedBuiltIns, object.name)) {
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
}
