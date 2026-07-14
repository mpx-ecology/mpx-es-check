export type IgnoreSourcePattern = string | RegExp

function normalizePath (value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.\//, '')
}

function escapeRegExp (value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
}

function globToRegExp (pattern: string): RegExp {
  const re = pattern.split('*').map(escapeRegExp).join('.*')
  return new RegExp(`(^|/)${re}($|/)`)
}

function hasGlob (pattern: string): boolean {
  return pattern.includes('*')
}

function isRegExpPattern (pattern: string): boolean {
  return /^\/.+\/[dgimsuvy]*$/.test(pattern)
}

function parseRegExpPattern (pattern: string): RegExp | null {
  if (!isRegExpPattern(pattern)) return null
  const lastSlash = pattern.lastIndexOf('/')
  try {
    return new RegExp(pattern.slice(1, lastSlash), pattern.slice(lastSlash + 1))
  } catch (e) {
    return null
  }
}

function isScopedPackageName (pattern: string): boolean {
  return /^@[^/]+\/[^/]+$/.test(pattern)
}

function isBarePackageName (pattern: string): boolean {
  return !pattern.includes('/') || isScopedPackageName(pattern)
}

function matchPackage (sourceFile: string, packageName: string): boolean {
  return sourceFile === `node_modules/${packageName}` ||
    sourceFile.includes(`/node_modules/${packageName}/`) ||
    sourceFile.startsWith(`node_modules/${packageName}/`)
}

function matchPath (sourceFile: string, pattern: string): boolean {
  return sourceFile === pattern ||
    sourceFile.endsWith(`/${pattern}`) ||
    sourceFile.startsWith(`${pattern}/`) ||
    sourceFile.includes(`/${pattern}/`)
}

function testRegExp (regexp: RegExp, sourceFile: string): boolean {
  regexp.lastIndex = 0
  return regexp.test(sourceFile)
}

export function isIgnoredSource (sourceFile: string | undefined, ignoreSource: IgnoreSourcePattern[] = []): boolean {
  if (!sourceFile || !ignoreSource.length) return false

  const normalizedSource = normalizePath(sourceFile)
  return ignoreSource.some(item => {
    if (item instanceof RegExp) return testRegExp(item, normalizedSource)
    const rawPattern = item.trim()
    if (!rawPattern) return false
    const regexp = parseRegExpPattern(rawPattern)
    if (regexp) return testRegExp(regexp, normalizedSource)
    const pattern = normalizePath(rawPattern)
    if (hasGlob(pattern)) return globToRegExp(pattern).test(normalizedSource)
    if (isBarePackageName(pattern) && matchPackage(normalizedSource, pattern)) return true
    return matchPath(normalizedSource, pattern)
  })
}
