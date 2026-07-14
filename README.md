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
* `--ignore-source <pattern>` 忽略 sourcemap 映射后的指定源文件或 npm 包中的报错，可重复使用多次，支持包名、路径、`*` 通配和 `/.../flags` 正则：
   ```bash
   npx mpx-es-check --target=es5 './dist/**/*.js' --ignore-source='custom-polyfills' --ignore-source='@babel/*'
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
* `--no-ignore-polyfills` 关闭对 polyfill 库报错的自动忽略（默认开启，见下方说明）
* `--allow-syntax <items>` 语法白名单，逗号分隔，支持 AST 节点类型或 message 子串
   ```bash
   npx mpx-es-check --target=es5 --allow-syntax 'ArrowFunctionExpression,Map.groupBy' './dist/*.js'
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
  ignoreSource: ['custom-polyfills'],          // 忽略指定源文件或 npm 包中的报错
  esmodule: true,
  useAllRules: false,
  ignorePolyfills: true,                       // 忽略来自 polyfill 库的报错，默认 true
  allowSyntax: ['ArrowFunctionExpression'],    // 语法白名单，nodeType 或 message 子串
})
process.exitCode = result.code

// 检测单段代码字符串，返回 Problem[]
const problems = check('foo.js', 'const x = () => 1', {
  target: 'es5',
  files: [],
  silent: true,
  ignorePolyfills: true,
  ignoreSource: ['src/vendor/polyfills'],
  allowSyntax: ['Map.groupBy'],
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
      // 可选：忽略 polyfill 库的报错，默认 true，详见下方"通用选项说明"
      // ignorePolyfills: true,
      // 可选：忽略指定源文件或 npm 包中的报错，详见下方"通用选项说明"
      // ignoreSource: ['custom-polyfills', 'src/vendor/polyfills'],
      // 可选：语法白名单，详见下方"通用选项说明"
      // allowSyntax: ['ArrowFunctionExpression', 'Map.groupBy'],
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

## 通用选项说明

以下选项在 CLI、Node.js API、Webpack 插件三种使用方式中行为一致。

### `ignoreSource`

忽略指定源文件或 npm 包中的报错，默认为空（不额外忽略任何来源）。适用于项目使用了自定义 polyfills 工具库，或需要临时放过某些文件、某些 npm 包中无法转换的语法/API。

匹配对象是 sourcemap 映射后的 `problem.sourceFile`；如果没有 sourcemap，则回退匹配产物文件名。匹配命中后，该来源下的所有 problem 都会被忽略。

支持四类写法：

| 写法 | 示例 | 说明 |
|---|---|---|
| npm 包名 | `custom-polyfills`、`@scope/polyfills` | 匹配 `node_modules/<package>/...` |
| 文件或目录路径 | `src/vendor/polyfills`、`dist/polyfills.bundle.js` | 匹配对应路径或其子路径 |
| `*` 通配 | `@babel/*`、`node_modules/custom-*`、`src/vendor/*` | 按路径片段通配匹配，可用于忽略一组包 |
| 正则表达式 | `/node_modules\\/(@babel|custom-polyfills)\\//` | CLI 使用 `/.../flags` 字符串；Node.js API / Webpack 插件也可直接传 `RegExp` |

```bash
# CLI：可重复传入
npx mpx-es-check --target=es5 './dist/**/*.js' \
  --ignore-source='custom-polyfills' \
  --ignore-source='@babel/*' \
  --ignore-source='/node_modules\/(@babel|custom-polyfills)\//'
```

```js
// Node.js API / Webpack 插件：字符串或 RegExp 数组
ignoreSource: [
  'custom-polyfills',
  '@babel/*',
  'src/vendor/polyfills',
  /node_modules\/(@babel|custom-polyfills)\//,
]
```

### `ignorePolyfills`

默认开启（CLI 默认不传即为开启，Node.js API / Webpack 插件默认 `true`）。

通过 sourcemap 将报错位置追溯回源文件，若源文件路径属于以下 polyfill 库则自动忽略该报错，避免误报：

| 库 | 匹配路径 |
|---|---|
| core-js / core-js-pure / core-js-compat | `node_modules/core-js*` |
| @babel/runtime / @babel/polyfill | `node_modules/@babel/runtime`、`node_modules/@babel/polyfill` |
| regenerator-runtime | `node_modules/regenerator-runtime` |

关闭方式：

```bash
# CLI
npx mpx-es-check --target=es5 --no-ignore-polyfills './dist/*.js'
```

```js
// Node.js API / Webpack 插件
ignorePolyfills: false
```

### `allowSyntax`

语法白名单，默认为空（不忽略任何报错）。可用于业务上已确认兼容、无需报错的语法或 API。

每个字符串与报错做两种匹配，任意命中即忽略该条报错：

| 匹配方式 | 说明 |
|---|---|
| **nodeType 精确匹配** | 字符串等于报错的 AST 节点类型（`problem.nodeType`） |
| **message 子串匹配** | 字符串包含于报错消息（`problem.message`） |

```bash
# CLI：逗号分隔
npx mpx-es-check --target=es5 --allow-syntax 'ArrowFunctionExpression,Map.groupBy' './dist/*.js'
```

```js
// Node.js API / Webpack 插件：字符串数组
allowSyntax: [
  'ArrowFunctionExpression',  // 按 nodeType 忽略所有箭头函数报错
  'Map.groupBy',              // 按 message 子串忽略 Map.groupBy 报错
  'for...of',                 // 按 message 子串忽略 for...of 报错
]
```

## 结果输出

检测到问题时以 ESLint 风格在终端输出，成功时静默无输出：

```
/path/to/src/foo.js
  6:0  error  Using const is not allowed
  12:4  error  Using ArrowFunction(箭头函数) is not allowed
```
