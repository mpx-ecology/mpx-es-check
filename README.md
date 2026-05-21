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
npx mpx-es-check --module --target=es5 './dist/*.js'
```

* `--module` 以 ES Module 模式解析代码，不设置则以 script 模式解析
* `--target <target>` 指定目标环境，详见下方 [--target 可选值](#--target-可选值)
* `'./dist/*.js'` 检测文件范围，使用 glob pattern；在脚本中需加 `''` 包裹，避免 shell 展开
  * 支持同时传多个 pattern，检测多个目录：
    ```bash
    npx mpx-es-check --target=es5 './dist/*.js' './lib/*.js'
    ```
* `--ignore <pattern>` 排除匹配该 glob 的文件，可重复使用多次：
   ```bash
   npx mpx-es-check --target=es5 './dist/**/*.js' --ignore='./dist/vendor/*.js' --ignore='./dist/polyfill.js'
   ```
* `--all` 同时检测实例方法和静态方法（基于 core-js-compat）
   ```bash
   npx mpx-es-check --module --target=es5 --all './dist/*.js'
   ```
* `--miniprogram` 检测微信小程序 `properties` 声明语法错误
* `--output <path>` 将检测结果同时写入指定文件，不指定则只输出到终端
   ```bash
   npx mpx-es-check --module --target=es5 --output ./dist/es-check.log './dist/*.js'
   ```

### --target 可选值

#### ECMAScript 版本

指定**目标环境**支持的最高 ES 版本，工具检测产物中是否含有该版本**以上**的语法。

例如 `--target=es5` 表示目标环境只支持 ES5，产物中不能出现任何 ES2015+ 语法；`--target=es2015` 则允许 ES2015 语法，但不允许 ES2016+。

| 值 | 别名 | 目标环境 | 检测范围 |
|---|---|---|---|
| `5` / `es5` | — | ES5 | ES2015+（let/const、箭头函数、class 等） |
| `6` / `es6` / `es2015` | — | ES2015 | ES2016+（`**`、`Array.includes` 等） |
| `7` / `es7` / `es2016` | — | ES2016 | ES2017+（async/await 等） |
| `8` / `es8` / `es2017` | — | ES2017 | ES2018+（对象展开、异步迭代等） |
| `9` / `es9` / `es2018` | — | ES2018 | ES2019+（可选 catch、`Array.flat` 等） |
| `10` / `es10` / `es2019` | — | ES2019 | ES2020+（可选链 `?.`、`??`、BigInt 等） |
| `11` / `es11` / `es2020` | — | ES2020 | ES2021+（逻辑赋值、`Promise.any` 等） |
| `12` / `es12` / `es2021` | — | ES2021 | ES2022+（顶层 await、类字段、`at()` 等） |
| `13` / `es13` / `es2022` | — | ES2022 | 无（允许所有已知语法） |

#### 运行时环境

针对特定 JS 引擎的不支持项进行检测，与 ECMAScript 版本无关。

| 值 | 说明 |
|---|---|
| `hermes` | 检测 Hermes 引擎不支持的语法/API：`with`、`import.meta`、`Symbol.species`、`Symbol.unscopables`、`Object.groupBy`、`Map.groupBy` |
| `drn` | 在 `hermes` 基础上，额外检测：class 语法、`for await...of`、动态 `import()`、`FinalizationRegistry`、`Array.prototype.toSorted`、`Promise.withResolvers`、`ArrayBuffer.prototype.resize`、`structuredClone` |

#### 不传 --target

不传 `--target` 时，工具自动读取项目的 Babel 配置（`babel.loadPartialConfig` + `core-js-compat`），只检测 Babel **应该转换但实际未转换**的语法/API，适合集成在构建流程中做精准检测。

### Node.js API

```js
const esCheck = require('@mpxjs/es-check')
const { check } = require('@mpxjs/es-check')

// 检测一批文件（同 CLI），返回 { code: 0 | 1 }
const result = esCheck({
  target: 'es5',
  files: ['./dist/**/*.js', './lib/**/*.js'],  // 支持多个 glob pattern
  ignore: ['./dist/vendor/**/*.js'],           // 排除文件，支持多个 glob pattern
  esmodule: true,
  useAllRules: false
})
process.exitCode = result.code

// 检测单段代码字符串，返回 Problem[]
const problems = check('foo.js', 'const x = () => 1', {
  target: 'es5',
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
      // 必填：目标环境，同 --target 参数，支持 es5、es2015~es2022、hermes、drn
      target: 'es5',
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
