// ES2021 语法测试文件
// 预期：--target=es2020 时报错，--target=es2021 时通过

// 逻辑赋值运算符
let a = null
a ??= 'default'

let b = 0
b ||= 42

let c = 1
c &&= 2
