# Mpx-es-check

项目构建产物**兼容性**检测，避免出现 babel 漏转或者是未经 babel 转码，造成因浏览器语法兼容问题的出错。

## install
```bash
npm i @mpxjs/es-check --save-dev
// or
npm i @mpxjs/es-check -g
```

## 使用方式

### CLI

```bash
npx mpx-es-check --module --ecma=6 './dist/*.js'
```

* --module 表示以 esModule 模块检测代码，如果不设置则表示使用 script 方式检测代码
* --ecma 语法规则
   - ecma后表示要检测的最低版本的语法，可以是 (6/ 7/ 8/ 9/ 10/ 11/ 12/ 13) 或者是 (2015/ 2016/ 2017/ 2018/ 2019/ 2020/ 2021/ 2022)
   - 特殊值：`hermes`（Hermes 引擎不支持的语法）、`drn`（DRN 引擎不支持的语法）
* ./dist/*.js 检测文件
   - 设置文件匹配的范围，使用 glob pattern 配置的方式,   somePath/*.js
   - 在脚本中使用时需要加 `''` 包裹，避免无法正确匹配文件
* --all 检测实例方法和静态方法
   - --all 在命令中添加 --all 参数会启用实例方法和静态方法的检测
   ```bash
   npx mpx-es-check --module --ecma=6 --all './dist/*.js'
   ```
* --miniprogram 检测微信小程序语法错误
  * 检测微信小程序中的props声明错误等
* --output 将检测结果输出到指定文件，不指定则只输出到终端
   ```bash
   npx mpx-es-check --module --ecma=6 --output ./dist/es-check.log './dist/*.js'
   ```

### Node.js API

```js
const esCheck = require('@mpxjs/es-check')
const { check } = require('@mpxjs/es-check')

// 检测一批文件（同 CLI），返回 { code: 0 | 1 }
const result = esCheck({
  version: 'es6',
  files: ['./dist/**/*.js'],
  esmodule: true,
  useAllRules: false
})
process.exitCode = result.code

// 检测单段代码字符串，返回 Problem[]
const problems = check('foo.js', 'const x = () => 1', {
  version: 'es6',
  files: [],
  silent: true
})
```

### Webpack 插件

需要 webpack 5。

```js
const EsCheckPlugin = require('@mpxjs/es-check/webpack-plugin')

module.exports = {
  plugins: [
    new EsCheckPlugin({
      // 必填：检测的最低 ECMAScript 版本，同 --ecma 参数
      version: 'es2015',
      // 必填：产物模块类型，'module' 或 'script'
      sourceType: 'script',
      // 可选：检测结果输出文件名，输出到 webpack output 目录；不填则不写文件
      // filename: 'es-check.log',
      // 可选：自定义规则扩展，callback 接收 { warnings, errors } 两个数组
      customRules: {
        callback ({ warnings, errors }, options, compilation) {
          // warnings: 非阻塞问题（type: 'warning'）
          // errors:   阻塞问题，同时会导致构建失败
        }
      }
    })
  ]
}
```

**说明：**
- 检测到语法错误时构建失败；配置 `filename` 后错误详情同时写入 `<output.path>/<filename>`
- 插件复用 mpx-webpack-plugin 生成的 AST（如果存在），避免重复解析
- 支持 watch 模式，每次重新编译结果独立不累积

## 结果输出

检测到问题时以 ESLint 风格在终端输出，成功时静默无输出：

```
/path/to/src/foo.js
  6:0  error  Using const is not allowed
  12:4  error  Using ArrowFunction(箭头函数) is not allowed
```
