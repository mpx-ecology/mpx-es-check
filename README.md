# Mpx-es-check

项目构建产物**兼容性**检测，避免出现 babel 漏转或者是未经 babel 转码，造成因浏览器语法兼容问题的出错。

## install
```bash
npm i @mpxjs/es-check --save-dev
// or
npm i @mpxjs/es-check -g
```

## Usage

* 如果是本地安装：在 package.json 中添加 scripts 命令
```bash
"esCheck": "mpx-es-check --module --ecma=6 './dist/*.js'"
```
* 如果是全局安装：可直接运行命令
```bash
mpx-es-check --module --ecma=6 ./dist/*.js
```

* --module 表示以 esModule 模块检测代码，如果不设置则表示使用 script 方式检测代码
* --ecma 语法规则
   - ecma后表示要检测的最低版本的语法，可以是 (6/ 7/ 8/ 9/ 10/ 11/ 12) 或者是 (2015/ 2016/ 2017/ 2018/ 2019/ 2020/ 2021)
* ./dist/*.js 检测文件
   - 设置文件匹配的范围，使用 glob pattern 配置的方式,   somePath/*.js
   - 在 脚本中使用时需要加 '' 包裹，避免无法正确匹配文件
* --all 检测实例方法和静态方法
   - --all 在命令中添加 --all 参数会启用实例方法和静态方法的检测
   ```js
   mpx-es-check --module --ecma=6 --all ./dist/*.js
   ```

## 结果输出

检测中如果有高版本语法, 则会在终端提示，并将检测结果输出到项目 ./dist/es-check.log 文件中, 如果没有 dist 文件夹，则会在项目根目录输出 log 文件
