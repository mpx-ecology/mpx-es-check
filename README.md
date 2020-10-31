# Mpx-es-check

项目构建产物**兼容性**检测，避免出现 babel 漏转或者是未经 babel 转码，造成因浏览器语法兼容问题的出错。

## install
```bash
npm i mpx-es-check --save-dev
// or
npm i mpx-es-check -g
```

## Usage

```bash
mpx-es-check --module es6 ./dist/*.js
```

* --module 默认以 esModule 检测代码
* 检测版本
   - 所需要检测的最低版本，输入es6 表示会检测 es6及以上的所有语法
* 检测文件
   - 设置文件匹配的范围,   somePath/*.js
