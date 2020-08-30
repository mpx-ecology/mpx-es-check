const estraverse = require('estraverse')
const createEmitter = require('./safe-emitter')
const NodeEventGenerator = require('./node-event-generator')
const createProblem = require('./create-problem')
const rule1 = require('../rules/ecma2015')
// TODO 动态调节配置校验规则
const configuredRules = [rule1]

function createRuleListeners(rule, ruleContext) {
  try {
    return rule.create(ruleContext)
  } catch (ex) {
    throw ex
  }
}

/**
 * 对代码按规则进行检查
 * @param {string} sourceCode 要检查的代码
 * @returns {[]} 问题数组
 */
function runRules(sourceCode) {
  const emitter = createEmitter()
  const nodeQueue = []
  const esProblems = []

  estraverse.traverse(sourceCode.ast, {
    enter(node, parent) {
      node.parent = parent;
      nodeQueue.push({isEntering: true, node})
    },
    leave(node) {
      nodeQueue.push({isEntering: false, node})
    },
  })

  configuredRules.forEach((rule, index) => {
    const ruleContext = Object.freeze(
      {
        id: index,
        options: [],
        report(...args) {
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
  const eventGenerator = new NodeEventGenerator(emitter)

  nodeQueue.forEach(traversalInfo => {
    currentNode = traversalInfo.node
    try {
      if (traversalInfo.isEntering) {
        eventGenerator.enterNode(currentNode)
      } else {
        eventGenerator.leaveNode(currentNode)
      }
    } catch (error) {
      throw error
    }
  })

  return esProblems
}

module.exports = runRules
