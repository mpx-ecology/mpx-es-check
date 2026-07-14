// ES2020 语法测试文件
// 预期：--target=es2019 时报错，--target=es2020 时通过

// BigInt
const big = 100n

// 可选链
const obj = { a: { b: 1 } }
const val = obj?.a?.b

// 空值合并
const name = null ?? 'default'

// 动态 import（需 --module 模式）
// const mod = import('./foo.js')
