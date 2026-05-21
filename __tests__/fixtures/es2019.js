// ES2019 语法测试文件
// 预期：--target=es2018 时报错，--target=es2019 时通过

// 可选 catch 绑定（catch 不带参数）
try {
  JSON.parse('invalid')
} catch {
  console.log('parse failed')
}
