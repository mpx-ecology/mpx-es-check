/**
 * @fileoverview The event generator for AST nodes.
 * @author Toru Nagashima
 */

import esquery from 'esquery'
import lodash from 'lodash'
import type { ASTNode, SafeEmitter } from '../types'

interface ASTSelector {
  rawSelector: string
  isExit: boolean
  parsedSelector: esquery.Selector
  listenerTypes: string[] | null
  attributeCount: number
  identifierCount: number
}

function getPossibleTypes (parsedSelector: Record<string, unknown>): string[] | null {
  switch (parsedSelector.type) {
    case 'identifier':
      return [parsedSelector.value as string]

    case 'matches': {
      const typesForComponents = (parsedSelector.selectors as Record<string, unknown>[]).map(getPossibleTypes)
      if (typesForComponents.every(Boolean)) {
        return lodash.union(...(typesForComponents as string[][]))
      }
      return null
    }

    case 'compound': {
      const typesForComponents = (parsedSelector.selectors as Record<string, unknown>[])
        .map(getPossibleTypes)
        .filter((t): t is string[] => t !== null)
      if (!typesForComponents.length) {
        return null
      }
      return lodash.intersection(...typesForComponents)
    }

    case 'child':
    case 'descendant':
    case 'sibling':
    case 'adjacent':
      return getPossibleTypes(parsedSelector.right as Record<string, unknown>)

    default:
      return null
  }
}

function countClassAttributes (parsedSelector: Record<string, unknown>): number {
  switch (parsedSelector.type) {
    case 'child':
    case 'descendant':
    case 'sibling':
    case 'adjacent':
      return countClassAttributes(parsedSelector.left as Record<string, unknown>) +
        countClassAttributes(parsedSelector.right as Record<string, unknown>)

    case 'compound':
    case 'not':
    case 'matches':
      return (parsedSelector.selectors as Record<string, unknown>[])
        .reduce((sum, childSelector) => sum + countClassAttributes(childSelector), 0)

    case 'attribute':
    case 'field':
    case 'nth-child':
    case 'nth-last-child':
      return 1

    default:
      return 0
  }
}

function countIdentifiers (parsedSelector: Record<string, unknown>): number {
  switch (parsedSelector.type) {
    case 'child':
    case 'descendant':
    case 'sibling':
    case 'adjacent':
      return countIdentifiers(parsedSelector.left as Record<string, unknown>) +
        countIdentifiers(parsedSelector.right as Record<string, unknown>)

    case 'compound':
    case 'not':
    case 'matches':
      return (parsedSelector.selectors as Record<string, unknown>[])
        .reduce((sum, childSelector) => sum + countIdentifiers(childSelector), 0)

    case 'identifier':
      return 1

    default:
      return 0
  }
}

function compareSpecificity (selectorA: ASTSelector, selectorB: ASTSelector): number {
  return selectorA.attributeCount - selectorB.attributeCount ||
    selectorA.identifierCount - selectorB.identifierCount ||
    (selectorA.rawSelector <= selectorB.rawSelector ? -1 : 1)
}

function tryParseSelector (rawSelector: string): esquery.Selector {
  try {
    return esquery.parse(rawSelector.replace(/:exit$/u, ''))
  } catch (err) {
    const e = err as { location?: { start?: { offset?: number } }; message?: string }
    if (e.location && e.location.start && typeof e.location.start.offset === 'number') {
      throw new SyntaxError(`Syntax error in selector "${rawSelector}" at position ${e.location.start.offset}: ${e.message}`)
    }
    throw err
  }
}

const parseSelector = lodash.memoize((rawSelector: string): ASTSelector => {
  const parsedSelector = tryParseSelector(rawSelector)
  return {
    rawSelector,
    isExit: rawSelector.endsWith(':exit'),
    parsedSelector,
    listenerTypes: getPossibleTypes(parsedSelector as unknown as Record<string, unknown>),
    attributeCount: countClassAttributes(parsedSelector as unknown as Record<string, unknown>),
    identifierCount: countIdentifiers(parsedSelector as unknown as Record<string, unknown>)
  }
})

class NodeEventGenerator {
  private emitter: SafeEmitter
  private currentAncestry: ASTNode[]
  private enterSelectorsByNodeType: Map<string, ASTSelector[]>
  private exitSelectorsByNodeType: Map<string, ASTSelector[]>
  private anyTypeEnterSelectors: ASTSelector[]
  private anyTypeExitSelectors: ASTSelector[]

  constructor (emitter: SafeEmitter) {
    this.emitter = emitter
    this.currentAncestry = []
    this.enterSelectorsByNodeType = new Map()
    this.exitSelectorsByNodeType = new Map()
    this.anyTypeEnterSelectors = []
    this.anyTypeExitSelectors = []

    emitter.eventNames().forEach(rawSelector => {
      const selector = parseSelector(rawSelector)
      if (selector.listenerTypes) {
        const typeMap = selector.isExit ? this.exitSelectorsByNodeType : this.enterSelectorsByNodeType
        selector.listenerTypes.forEach(nodeType => {
          if (!typeMap.has(nodeType)) {
            typeMap.set(nodeType, [])
          }
          (typeMap.get(nodeType) as typeof selector[]).push(selector)
        })
        return
      }
      const selectors = selector.isExit ? this.anyTypeExitSelectors : this.anyTypeEnterSelectors
      selectors.push(selector)
    })

    this.anyTypeEnterSelectors.sort(compareSpecificity)
    this.anyTypeExitSelectors.sort(compareSpecificity)
    this.enterSelectorsByNodeType.forEach(selectorList => selectorList.sort(compareSpecificity))
    this.exitSelectorsByNodeType.forEach(selectorList => selectorList.sort(compareSpecificity))
  }

  applySelector (node: ASTNode, selector: ASTSelector, path: unknown): void {
    if (esquery.matches(node as unknown as import('estree').Node, selector.parsedSelector as esquery.Selector, this.currentAncestry as unknown as import('estree').Node[])) {
      this.emitter.emit(selector.rawSelector, node, path)
    }
  }

  applySelectors (node: ASTNode, isExit: boolean, path: unknown): void {
    const selectorsByNodeType = (isExit ? this.exitSelectorsByNodeType : this.enterSelectorsByNodeType).get(node.type) || []
    const anyTypeSelectors = isExit ? this.anyTypeExitSelectors : this.anyTypeEnterSelectors

    let selectorsByTypeIndex = 0
    let anyTypeSelectorsIndex = 0

    while (selectorsByTypeIndex < selectorsByNodeType.length || anyTypeSelectorsIndex < anyTypeSelectors.length) {
      if (
        selectorsByTypeIndex >= selectorsByNodeType.length ||
        (anyTypeSelectorsIndex < anyTypeSelectors.length &&
        compareSpecificity(anyTypeSelectors[anyTypeSelectorsIndex], selectorsByNodeType[selectorsByTypeIndex]) < 0)
      ) {
        this.applySelector(node, anyTypeSelectors[anyTypeSelectorsIndex++], path)
      } else {
        this.applySelector(node, selectorsByNodeType[selectorsByTypeIndex++], path)
      }
    }
  }

  enterNode (node: ASTNode, path: unknown): void {
    if (node.parent) {
      this.currentAncestry.unshift(node.parent)
    }
    this.applySelectors(node, false, path)
  }

  leaveNode (node: ASTNode, path: unknown): void {
    this.applySelectors(node, true, path)
    this.currentAncestry.shift()
  }
}

export default NodeEventGenerator
