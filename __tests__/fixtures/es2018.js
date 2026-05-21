// ES2018 语法测试文件
// 预期：--target=es2017 时报错，--target=es2018 时通过

// 对象展开运算符
const base = { a: 1 }
const extended = { ...base, b: 2 }

// for await...of
async function processStream() {
  const items = [Promise.resolve(1), Promise.resolve(2)]
  for await (const item of items) {
    void item
  }
}
