import fs from 'fs'
import path from 'path'

const resolvePath = path.resolve()

const defaultOutputFile = 'es-check.log'

/**
 * 获取结果文件输出的路径
 */
export function getLogOutputPath (customOutputFile: string): string {
  let outputPath = resolvePath
  if (customOutputFile !== defaultOutputFile) {
    outputPath = path.resolve(outputPath, customOutputFile)
  } else {
    outputPath += fs.existsSync(resolvePath + '/dist') ? '/dist/es-check.log' : '/es-check.log'
  }
  return outputPath
}
