const babelTraverse = require('@babel/traverse').default
const estraverse = require('estraverse')
const createEmitter = require('./safe-emitter')
const NodeEventGenerator = require('./node-event-generator')
const createProblem = require('./create-problem')

function createRuleListeners (rule, ruleContext) {
  return rule.create(ruleContext)
}
let ruleListener = false
const emitter = createEmitter()
let esProblems = []
/**
 * 对代码按规则进行检查
 * @param {string} sourceCode 要检查的代码
 * @param configuredRules
 * @param isPlugin
 * @returns {[]} 问题数组
 */
function runRules (sourceCode, configuredRules, isPlugin) {
  const nodeQueue = []
  const { ast } = sourceCode
  esProblems = []
  if (isPlugin) { // 如果是webpack plugin使用，则使用estraverse遍历ast(ast复用)
    estraverse.traverse(ast, {
      enter (node, parent) {
        const path = {
          parent
        }
        nodeQueue.push({ isEntering: true, node, path })
      }
    })
  } else {
    babelTraverse(ast, {
      enter (path) {
        const node = path.node
        nodeQueue.push({ isEntering: true, node, path })
      }
    })
  }
  if (!ruleListener) {
    configuredRules.forEach((rule, index) => {
      const ruleContext = Object.freeze(
        {
          id: index,
          options: [],
          report: (...args) => {
            const problem = createProblem(...args)
            esProblems.push(problem)
          }
        }
      )
      const ruleListeners = createRuleListeners(rule, ruleContext)
      Object.keys(ruleListeners).forEach(selector => {
        emitter.on(
          selector,
          ruleListeners[selector]
        )
      })
    })
    ruleListener = true
  }

  const eventGenerator = new NodeEventGenerator(emitter)
  // ast 节点数组开始执行
  nodeQueue.forEach(traversalInfo => {
    const currentNode = traversalInfo.node
    const currentPath = traversalInfo.path
    if (traversalInfo.isEntering) {
      eventGenerator.enterNode(currentNode, currentPath)
    } else {
      eventGenerator.leaveNode(currentNode, currentPath)
    }
  })

  return esProblems
}

module.exports = runRules
