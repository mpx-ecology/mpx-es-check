const babel = require('@babel/core')
const coreJsCompat = require('core-js-compat')
const rule6 = require('../rules/ecma2015')
const rule7 = require('../rules/ecma2016')
const rule8 = require('../rules/ecma2017')
const rule9 = require('../rules/ecma2018')
const rule10 = require('../rules/ecma2019')
const rule11 = require('../rules/ecma2020')
const rule12 = require('../rules/ecma2021')
const rule13 = require('../rules/ecma2022')
const methodRules = require('../rules/methodRules')
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

function getTargetByConfig (config) {
  const { targets, presets = [] } = config || {}
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

module.exports = function (version, useAllRules) {
  const configuredRules = []
  const usePlugins = new Map()
  const { plugins = [] } = babel.loadOptions()
  const partialConfig = babel.loadPartialConfig()
  const targets = getTargetByConfig(partialConfig)
  const { list } = coreJsCompat({ targets })

  plugins.forEach(plugin => {
    usePlugins.set(
      plugin.key.replace(/^transform-|proposal-/g, ''),
      true
    )
  })

  let esV = versionMap[version]
  while (esV <= 13) {
    configuredRules.push(allRules[`rule${esV}`](usePlugins))
    esV++
  }
  if (useAllRules) {
    configuredRules.push(methodRules(list))
  }

  return configuredRules
}
