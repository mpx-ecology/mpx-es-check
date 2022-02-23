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
 * @returns {[]} 问题数组
 */
function runRules (sourceCode, configuredRules) {
  const nodeQueue = []
  esProblems = []
  // console.log(JSON.stringify(configuredRules))
  // 遍历 ast
  estraverse.traverse(sourceCode.ast, {
    enter (node, parent) {
      const path = {
        parent
      }
      nodeQueue.push({ isEntering: true, node, path })
    }
  })
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
