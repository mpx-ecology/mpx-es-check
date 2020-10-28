const estraverse = require('estraverse')
const traverse = require('@babel/traverse').default
const createEmitter = require('./safe-emitter')
const NodeEventGenerator = require('./node-event-generator')
const createProblem = require('./create-problem')
const rule6 = require('../rules/ecma2015')
const rule7 = require('../rules/ecma2016')
const rule8 = require('../rules/ecma2017')
const rule9 = require('../rules/ecma2018')
const rule10 = require('../rules/ecma2019')
const rule11 = require('../rules/ecma2020')
const rule12 = require('../rules/ecma2021')
const ruleMethod = require('../rules/methodRules')
const configuredRules = [ruleMethod]
const allRules = {
  rule6,
  rule7,
  rule8,
  rule9,
  rule10,
  rule11,
  rule12,
  ruleMethod
}
function createRuleListeners (rule, ruleContext) {
  return rule.create(ruleContext)
}

/**
 * 对代码按规则进行检查
 * @param {string} sourceCode 要检查的代码
 * @returns {[]} 问题数组
 */
function runRules (sourceCode, esVersion) {
  const emitter = createEmitter()
  const nodeQueue = []
  const esProblems = []
  let esV = esVersion
  while (esV <= 12) {
    configuredRules.push(allRules[`rule${esV}`])
    esV++
  }
  // console.log(JSON.stringify(configuredRules))
  // 遍历 ast
  traverse(sourceCode.ast, {
    enter (path) {
      const node  = path.node
      nodeQueue.push({ isEntering: true, node, path })
    },
    exit (path) {
      const node  = path.node
      nodeQueue.push({ isEntering: false, node, path })
    }
  })

  configuredRules.forEach((rule, index) => {
    const ruleContext = Object.freeze(
      {
        id: index,
        options: [],
        report (...args) {
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
