// eslint-disable-next-line @typescript-eslint/no-var-requires
import estraverse from 'estraverse'
import createEmitter from './safe-emitter'
import NodeEventGenerator from './node-event-generator'
import createProblem from './create-problem'
import type { ASTNode, Rule, Problem } from '../types'
const babelTraverse = require('@babel/traverse').default

function createRuleListeners (rule: Rule, ruleContext: Parameters<Rule['create']>[0]) {
  return rule.create(ruleContext)
}

/**
 * 对代码按规则进行检查
 */
function runRules (sourceCode: { ast: ASTNode }, configuredRules: Rule[], isPlugin?: boolean): Problem[] {
  const { ast } = sourceCode
  const esProblems: Problem[] = []
  const emitter = createEmitter()

  configuredRules.forEach((rule, index) => {
    const ruleContext = Object.freeze({
      id: index,
      options: [] as unknown[],
      report: (...args: Parameters<typeof createProblem>) => {
        const problem = createProblem(...args)
        esProblems.push(problem)
      }
    })
    const ruleListeners = createRuleListeners(rule, ruleContext)
    Object.keys(ruleListeners).forEach(selector => {
      emitter.on(selector, ruleListeners[selector] as (...args: unknown[]) => void)
    })
  })

  const eventGenerator = new NodeEventGenerator(emitter)

  if (isPlugin) {
    estraverse.traverse(ast as unknown as import('estree').Node, {
      enter (node: import('estree').Node, parent: import('estree').Node | null) {
        eventGenerator.enterNode(node as unknown as ASTNode, { parent })
      }
    })
  } else {
    const nodeQueue: Array<{ isEntering: boolean; node: ASTNode; path: unknown }> = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    babelTraverse(ast, {
      enter (path: { node: unknown }) {
        nodeQueue.push({ isEntering: true, node: path.node as ASTNode, path })
      }
    })
    nodeQueue.forEach(({ isEntering, node, path }) => {
      if (isEntering) {
        eventGenerator.enterNode(node, path)
      } else {
        eventGenerator.leaveNode(node, path)
      }
    })
  }

  return esProblems
}

export default runRules
