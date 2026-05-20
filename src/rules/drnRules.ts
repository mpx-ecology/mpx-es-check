import hermesRules from './hermesRules'
import type { Rule, ASTNode, RuleVisitors } from '../types'

export default function (): Rule {
  const hermes = hermesRules()
  const hermesCreate = hermes.create

  return {
    meta: {
      docs: {
        description: 'DRN engine unsupported syntax/API rules (based on Hermes rules, additionally disallows class syntax and other unsupported features)'
      }
    },
    create (context) {
      const visitors: RuleVisitors = hermesCreate(context)

      // ── class syntax ──────────────────────────────────────────────────────
      // Report once at the class root node; skip sub-nodes (ClassBody / MethodDefinition etc.)
      visitors.ClassDeclaration = function (node: ASTNode) {
        context.report({
          node,
          message: 'DRN does not support class syntax.'
        })
      }
      visitors.ClassExpression = function (node: ASTNode) {
        context.report({
          node,
          message: 'DRN does not support class syntax.'
        })
      }

      // ── for await...of ────────────────────────────────────────────────────
      visitors.ForOfStatement = function (node: ASTNode) {
        if (node.await === true) {
          context.report({
            node,
            message: 'DRN does not support `for await...of` (async generators are unsupported).'
          })
        }
      }

      // ── import() dynamic import ───────────────────────────────────────────
      // @babel/parser: callee.type === 'Import' inside a CallExpression
      // acorn/plugin mode: node type is 'ImportExpression'
      visitors.ImportExpression = function (node: ASTNode) {
        context.report({
          node,
          message: 'DRN does not support dynamic `import()` expressions.'
        })
      }

      // ── FinalizationRegistry ──────────────────────────────────────────────
      // Catches: new FinalizationRegistry(...) and bare FinalizationRegistry references
      visitors.NewExpression = function (node: ASTNode) {
        const callee = node.callee as { type?: string; name?: string } | undefined
        if (callee?.type === 'Identifier' && callee.name === 'FinalizationRegistry') {
          context.report({
            node,
            message: 'DRN does not support `FinalizationRegistry`.'
          })
        }
      }

      // ── CallExpression: Array.toSorted / Promise.withResolvers /
      //    ArrayBuffer.resize / structuredClone ─────────────────────────────
      // Note: Object.groupBy and Map.groupBy are already covered by hermesRules.
      const originalCallExpression = visitors.CallExpression

      visitors.CallExpression = function (node: ASTNode, path?: unknown) {
        // Delegate to hermes handler first (covers groupBy)
        if (originalCallExpression) {
          originalCallExpression(node, path)
        }

        const callee = node.callee as {
          type?: string
          object?: { type?: string; name?: string }
          property?: { type?: string; name?: string }
          computed?: boolean
          name?: string
        } | undefined

        if (!callee) return

        // import() — babel parses dynamic import as CallExpression with callee.type === 'Import'
        if (callee.type === 'Import') {
          context.report({
            node,
            message: 'DRN does not support dynamic `import()` expressions.'
          })
          return
        }

        // structuredClone(...)
        if (callee.type === 'Identifier' && callee.name === 'structuredClone') {
          context.report({
            node,
            message: 'DRN does not support `structuredClone`.'
          })
          return
        }

        if (callee.type !== 'MemberExpression' || callee.computed) return

        const objName = callee.object?.name
        const propName = callee.property?.name

        // Array.toSorted(...)  — instance method, triggered via any .toSorted() call
        if (propName === 'toSorted') {
          context.report({
            node,
            message: 'DRN does not support `Array.prototype.toSorted`.'
          })
          return
        }

        // Promise.withResolvers()
        if (objName === 'Promise' && propName === 'withResolvers') {
          context.report({
            node,
            message: 'DRN does not support `Promise.withResolvers`.'
          })
          return
        }

        // ArrayBuffer.prototype.resize — triggered via any .resize() call
        // Narrowed to callee whose object is named "buf" / "buffer" / "ArrayBuffer"
        // or left as a broad .resize() check to catch all cases.
        if (propName === 'resize' && callee.object?.type === 'Identifier') {
          context.report({
            node,
            message: 'DRN does not support `ArrayBuffer.prototype.resize`.'
          })
          return
        }
      }

      return visitors
    }
  }
}
