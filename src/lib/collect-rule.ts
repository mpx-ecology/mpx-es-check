// eslint-disable-next-line @typescript-eslint/no-var-requires
const babel = require('@babel/core') as typeof import('@babel/core')
import coreJsCompat from 'core-js-compat'
import browserslist from 'browserslist'
import rule6 from '../rules/ecma2015'
import rule7 from '../rules/ecma2016'
import rule8 from '../rules/ecma2017'
import rule9 from '../rules/ecma2018'
import rule10 from '../rules/ecma2019'
import rule11 from '../rules/ecma2020'
import rule12 from '../rules/ecma2021'
import rule13 from '../rules/ecma2022'
import methodRules from '../rules/methodRules'
import miniprogramRules from '../rules/miniprogramRules'
import hermesRules from '../rules/hermesRules'
import drnRules from '../rules/drnRules'
import { versionMap, HERMES_VERSION, DRN_VERSION } from './constant'
import type { Rule } from '../types'

export interface CollectRuleOptions {
  customRules?: Rule
  [key: string]: unknown
}

const allRules: Record<string, (checkPlugin: (name: string) => boolean) => Rule> = {
  rule6,
  rule7,
  rule8,
  rule9,
  rule10,
  rule11,
  rule12,
  rule13
}

function getTargetByConfig (config: babel.PartialConfig | null): string | Record<string, string> | null {
  if (!config) return null
  const opts = config.options as { targets?: Record<string, string>; presets?: Array<{ options?: { targets?: Record<string, string> } }> } | undefined
  const { targets, presets = [] } = opts || {}
  if (targets && Object.keys(targets).length) {
    return targets
  } else {
    for (const item of presets) {
      const { options = {} } = item
      if (options.targets && Object.keys(options.targets).length) {
        return options.targets
      }
    }
  }
  return null
}

function getBabelConfig (): { list: string[]; plugins: babel.PluginItem[] } {
  const opts = babel.loadOptions({}) || {}
  const plugins = (opts as { plugins?: babel.PluginItem[] }).plugins || []
  const partialConfig = babel.loadPartialConfig({})
  const targets = getTargetByConfig(partialConfig) || browserslist.loadConfig({ path: process.cwd() }) || undefined
  const { list = [] } = coreJsCompat({ targets: targets as string | string[] | Record<string, string> | undefined })
  return {
    list,
    plugins
  }
}

export default function collectRule (
  rule: string | undefined,
  useAllRules: boolean,
  options: CollectRuleOptions,
  checkMiniprogram?: boolean
): Rule[] {
  const configuredRules: Rule[] = []
  const usePlugins = new Map<string, boolean>()
  let plugins: babel.PluginItem[] | null = null
  let list: string[] | null = null

  if (!rule) {
    const config = getBabelConfig()
    plugins = config.plugins
    list = config.list
    plugins.forEach(plugin => {
      const p = plugin as { key?: string }
      if (p.key) {
        usePlugins.set(
          p.key.replace(/^transform-|proposal-/g, ''),
          true
        )
      }
    })
  }

  function checkPlugin (pluginName: string): boolean {
    if (rule) return true
    return usePlugins.has(pluginName)
  }

  let esV = parseInt(versionMap[rule || 'es2015'] || '6', 10)
  if (rule === HERMES_VERSION) {
    configuredRules.push(hermesRules())
  } else if (rule === DRN_VERSION) {
    configuredRules.push(drnRules())
  } else {
    while (esV <= 13) {
      configuredRules.push(allRules[`rule${esV}`](checkPlugin))
      esV++
    }
  }

  if (checkMiniprogram) {
    configuredRules.push(miniprogramRules())
  }

  if (useAllRules) {
    configuredRules.push(methodRules(list ?? []))
  }

  if (options.customRules) {
    configuredRules.push(options.customRules)
  }

  return configuredRules
}
