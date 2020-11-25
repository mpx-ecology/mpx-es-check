const fs = require('fs')
const path = require('path')
const resolvePath = path.resolve()


function getLogOutputPath () {
  let outputPath = resolvePath
  outputPath += fs.existsSync(resolvePath+'/dist')? '/dist/es-check.log': '/es-check.log'
  return outputPath
}

module.exports = {
  getLogOutputPath
}
