// ES2015 语法测试文件
// 预期：--target=es5 时全部报错，--target=es2015 时全部通过

// let / const
let a = 1
const b = 2

// 箭头函数
const fn = () => a + b

// 模板字符串
const str = `hello ${a}`

// 解构赋值
const [c, d] = [1, 2]
const { x, y } = { x: 1, y: 2 }

// 默认参数
function greet(name = 'world') {
  return name
}

// rest 参数
function sum(...args) {
  return args
}

// 展开运算符
const arr = [...[1, 2], 3]
const obj = { a: 1 }

// class
class Animal {
  constructor(name) {
    this.name = name
  }
  speak() {
    return this.name
  }
}

class Dog extends Animal {
  speak() {
    return super.speak() + ' barks'
  }
}

// generator
function* gen() {
  yield 1
  yield 2
}

// for...of
for (const item of [1, 2, 3]) {
  void item
}

// import / export（需要 --module 才能解析）
// import foo from './foo'
// export default {}
