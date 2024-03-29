const babel = require('@babel/core')
const coreJsCompat = require('core-js-compat')
const browserslist = require('browserslist')
const rule6 = require('../rules/ecma2015')
const rule7 = require('../rules/ecma2016')
const rule8 = require('../rules/ecma2017')
const rule9 = require('../rules/ecma2018')
const rule10 = require('../rules/ecma2019')
const rule11 = require('../rules/ecma2020')
const rule12 = require('../rules/ecma2021')
const rule13 = require('../rules/ecma2022')
const methodRules = require('../rules/methodRules')
const miniprogramRules = require('../rules/miniprogramRules')
const { versionMap } = require('./constant')

const allRules = {
  rule6,
  rule7,
  rule8,
  rule9,
  rule10,
  rule11,
  rule12,
  rule13
}

const configuredRules = []

function getTargetByConfig (config) {
  const { targets, presets = [] } = config.options || {}
  if (targets && Object.keys(targets).length) {
    return targets
  } else {
    presets.forEach(item => {
      const { options = {} } = item
      if (options.targets && Object.keys(options.targets).length) {
        return options.targets
      }
    })
  }
  return ''
}

function getBabelConfig () {
  const { plugins = [] } = babel.loadOptions()
  const partialConfig = babel.loadPartialConfig()
  const targets = getTargetByConfig(partialConfig) || browserslist.loadConfig({ path: process.cwd() })
  const { list = [] } = coreJsCompat({ targets })
  return {
    list,
    plugins
  }
}

module.exports = function (version, useAllRules, options, checkMiniprogram) {
  if (configuredRules.length) {
    return configuredRules
  }
  const usePlugins = new Map()
  let plugins = null
  let list = null
  if (!version) { // 不传version，则使用babel config
    const config = getBabelConfig()
    plugins = config.plugins
    list = config.list
    plugins.forEach(plugin => {
      usePlugins.set(
        plugin.key.replace(/^transform-|proposal-/g, ''),
        true
      )
    })
  }

  function checkPlugin (pluginName) {
    if (version) return true
    return usePlugins.has(pluginName) // 不传version时，才需要检验babel中是否存在该plugin
  }

  let esV = versionMap[version || 'es2015']
  while (esV <= 13) {
    configuredRules.push(allRules[`rule${esV}`](checkPlugin))
    esV++
  }
  if (checkMiniprogram) {
    configuredRules.push(miniprogramRules())
  }
  if (useAllRules) {
    configuredRules.push(methodRules(list))
  }

  if (options.customRules) {
    configuredRules.push(options.customRules)
  }
  return configuredRules
}
