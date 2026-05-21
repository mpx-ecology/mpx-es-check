// ES2022 语法测试文件
// 预期：--target=es2021 时报错，--target=es2022 时通过

// 类私有字段
class Counter {
  #count = 0

  increment() {
    this.#count++
  }

  get #value() {
    return this.#count
  }

  static #instances = 0
}
