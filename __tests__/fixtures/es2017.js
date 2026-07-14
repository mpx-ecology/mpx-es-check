// ES2017 语法测试文件
// 预期：--target=es2016 时报错，--target=es2017 时通过

// async function
async function fetchData() {
  return 42
}

// async 箭头函数
const load = async () => {
  return 1
}

// await
async function run() {
  const result = await fetchData()
  return result
}
