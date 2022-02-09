const caniuseApi = require('caniuse-api')

/**
 * caniuse-api 判断是否支持当前语法
 * @param feature
 * @param browsers
 * @param report
 */
module.exports = function (feature, browsers, report) {
  const features = feature.split('|')
  const res = features.every(item => {
    return caniuseApi.isSupported(item, browsers)
  })
  if (!res) {
    report()
  }
}
