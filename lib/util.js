const fs = require('fs')
const path = require('path')
const resolvePath = path.resolve()

const defaultOutputFile = 'es-check.log'

/**
 * 获取结果文件输出的路径，
 * 如果是自定义的输出路径则，会用path.resolve尝试拼接出最终路径
 * 如果是默认路径，会检测如果当前目录下有dist文件夹，就输出到dist文件夹内，没有则输出到当前文件夹下
 * @returns {string} 最终log的输出路径
 */
function getLogOutputPath (customOutputFile) {
  let outputPath = resolvePath
  if (customOutputFile !== defaultOutputFile) {
    outputPath = path.resolve(outputPath, customOutputFile)
  } else {
    outputPath += fs.existsSync(resolvePath + '/dist') ? '/dist/es-check.log' : '/es-check.log'
  }
  return outputPath
}

module.exports = {
  getLogOutputPath
}
