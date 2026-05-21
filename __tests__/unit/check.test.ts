/**
 * 单元测试：通过内联代码片段验证各 ES 版本规则
 */
import { check } from '../../src/lib/index'
import type { Problem } from '../../src/types'

function hasMsg (problems: Problem[], keyword: string): boolean {
  return problems.some(p => p.message.includes(keyword))
}

const opts = { files: [], silent: true }

// ─────────────────────────────────────────────
// ES5 纯净代码
// ─────────────────────────────────────────────
describe('ES5 纯净代码', () => {
  const code = `var a = 1; var b = 2; function A() { console.log(123) }`

  test('target=es5 不报错', () => {
    expect(check('f.js', code, { ...opts, target: 'es5' })).toHaveLength(0)
  })

  test('target=es2022 不报错', () => {
    expect(check('f.js', code, { ...opts, target: 'es2022' })).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ES2015
// ─────────────────────────────────────────────
describe('ES2015 语法规则', () => {
  test('let/const — target=es5 报错', () => {
    const p = check('f.js', 'let a = 1; const b = 2', { ...opts, target: 'es5' })
    expect(hasMsg(p, 'let')).toBe(true)
    expect(hasMsg(p, 'const')).toBe(true)
  })

  test('let/const — target=es2015 通过', () => {
    expect(check('f.js', 'let a = 1; const b = 2', { ...opts, target: 'es2015' })).toHaveLength(0)
  })

  test('箭头函数 — target=es5 报错', () => {
    expect(hasMsg(check('f.js', 'const fn = () => 1', { ...opts, target: 'es5' }), 'ArrowFunction')).toBe(true)
  })

  test('模板字符串 — target=es5 报错', () => {
    expect(hasMsg(check('f.js', 'const s = `hello`', { ...opts, target: 'es5' }), 'TemplateLiteral')).toBe(true)
  })

  test('class 声明 — target=es5 报错', () => {
    expect(hasMsg(check('f.js', 'class Foo {}', { ...opts, target: 'es5' }), 'class')).toBe(true)
  })

  test('generator — target=es5 报错', () => {
    expect(hasMsg(check('f.js', 'function* gen() { yield 1 }', { ...opts, target: 'es5' }), 'generator')).toBe(true)
  })

  test('for...of — target=es5 报错', () => {
    expect(hasMsg(check('f.js', 'for (const x of [1,2]) {}', { ...opts, target: 'es5' }), 'for')).toBe(true)
  })

  test('默认参数 — target=es5 报错', () => {
    expect(hasMsg(check('f.js', 'function f(a = 1) {}', { ...opts, target: 'es5' }), 'AssignmentPattern')).toBe(true)
  })

  test('rest 参数 — target=es5 报错', () => {
    expect(hasMsg(check('f.js', 'function f(...args) {}', { ...opts, target: 'es5' }), 'RestElement')).toBe(true)
  })

  test('spread 展开 — target=es5 报错', () => {
    expect(hasMsg(check('f.js', 'const a = [...[1,2]]', { ...opts, target: 'es5' }), 'SpreadElement')).toBe(true)
  })

  test('全部 ES2015 语法 — target=es2015 通过', () => {
    const code = `
      let a = 1; const b = 2
      const fn = () => a + b
      const s = \`hello \${a}\`
      class Foo { bar() {} }
      function* gen() { yield 1 }
      for (const x of [1]) {}
      function f(x = 1, ...rest) {}
      const arr = [...[1,2]]
    `
    expect(check('f.js', code, { ...opts, target: 'es2015' })).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ES2016
// ─────────────────────────────────────────────
describe('ES2016 语法规则', () => {
  test('幂运算符 ** — target=es2015 报错', () => {
    expect(hasMsg(check('f.js', 'const x = 2 ** 10', { ...opts, target: 'es2015' }), '**')).toBe(true)
  })

  test('幂赋值 **= — target=es2015 报错', () => {
    expect(hasMsg(check('f.js', 'let x = 2; x **= 3', { ...opts, target: 'es2015' }), '**=')).toBe(true)
  })

  test('target=es2016 通过', () => {
    expect(check('f.js', 'const x = 2 ** 10; let y = 2; y **= 3', { ...opts, target: 'es2016' })).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ES2017
// ─────────────────────────────────────────────
describe('ES2017 语法规则', () => {
  test('async function — target=es2016 报错', () => {
    expect(hasMsg(check('f.js', 'async function f() {}', { ...opts, target: 'es2016' }), 'async')).toBe(true)
  })

  test('async 箭头函数 — target=es2016 报错', () => {
    expect(hasMsg(check('f.js', 'const f = async () => {}', { ...opts, target: 'es2016' }), 'async')).toBe(true)
  })

  test('target=es2017 通过', () => {
    expect(check('f.js', 'async function f() { return 1 }', { ...opts, target: 'es2017' })).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ES2018
// ─────────────────────────────────────────────
describe('ES2018 语法规则', () => {
  test('对象展开 — target=es2017 报错', () => {
    expect(hasMsg(check('f.js', 'const a = { ...{} }', { ...opts, target: 'es2017' }), 'SpreadElement')).toBe(true)
  })

  test('for await...of — target=es2017 报错', () => {
    expect(hasMsg(check('f.js', 'async function f() { for await (const x of []) {} }', { ...opts, target: 'es2017' }), 'for_await_of')).toBe(true)
  })

  test('target=es2018 通过', () => {
    expect(check('f.js', 'const a = { ...{} }', { ...opts, target: 'es2018' })).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ES2019
// ─────────────────────────────────────────────
describe('ES2019 语法规则', () => {
  test('可选 catch — target=es2018 报错', () => {
    expect(hasMsg(check('f.js', 'try {} catch {}', { ...opts, target: 'es2018' }), 'CatchClause')).toBe(true)
  })

  test('target=es2019 通过', () => {
    expect(check('f.js', 'try {} catch {}', { ...opts, target: 'es2019' })).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ES2020
// ─────────────────────────────────────────────
describe('ES2020 语法规则', () => {
  test('BigInt — target=es2019 报错', () => {
    expect(hasMsg(check('f.js', 'const n = 100n', { ...opts, target: 'es2019' }), 'BigInt')).toBe(true)
  })

  test('可选链 ?. — target=es2019 报错', () => {
    expect(hasMsg(check('f.js', 'const x = a?.b', { ...opts, target: 'es2019' }), 'ChainExpression')).toBe(true)
  })

  test('空值合并 ?? — target=es2019 报错', () => {
    expect(hasMsg(check('f.js', 'const x = null ?? "default"', { ...opts, target: 'es2019' }), '??')).toBe(true)
  })

  test('target=es2020 通过', () => {
    expect(check('f.js', 'const n = 100n; const x = null ?? "x"; const y = a?.b', { ...opts, target: 'es2020' })).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ES2021
// ─────────────────────────────────────────────
describe('ES2021 语法规则', () => {
  test('??= 逻辑赋值 — target=es2020 报错', () => {
    expect(hasMsg(check('f.js', 'let a = null; a ??= 1', { ...opts, target: 'es2020' }), '??=')).toBe(true)
  })

  test('||= 逻辑赋值 — target=es2020 报错', () => {
    expect(hasMsg(check('f.js', 'let a = 0; a ||= 1', { ...opts, target: 'es2020' }), '||=')).toBe(true)
  })

  test('&&= 逻辑赋值 — target=es2020 报错', () => {
    expect(hasMsg(check('f.js', 'let a = 1; a &&= 2', { ...opts, target: 'es2020' }), '&&=')).toBe(true)
  })

  test('target=es2021 通过', () => {
    expect(check('f.js', 'let a = null; a ??= 1; let b = 0; b ||= 1; let c = 1; c &&= 2', { ...opts, target: 'es2021' })).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// Hermes 专项规则
// ─────────────────────────────────────────────
describe('Hermes 规则', () => {
  test('with 语句 — 报错', () => {
    expect(hasMsg(check('f.js', 'with ({}) {}', { ...opts, target: 'hermes' }), 'with')).toBe(true)
  })

  test('Symbol.species — 报错', () => {
    expect(hasMsg(check('f.js', 'const s = Symbol.species', { ...opts, target: 'hermes' }), 'Symbol.species')).toBe(true)
  })

  test('Symbol.unscopables — 报错', () => {
    expect(hasMsg(check('f.js', 'const s = Symbol.unscopables', { ...opts, target: 'hermes' }), 'Symbol.unscopables')).toBe(true)
  })

  test('Object.groupBy — 报错', () => {
    expect(hasMsg(check('f.js', 'Object.groupBy([], x => x)', { ...opts, target: 'hermes' }), 'Object.groupBy')).toBe(true)
  })

  test('Map.groupBy — 报错', () => {
    expect(hasMsg(check('f.js', 'Map.groupBy([], x => x)', { ...opts, target: 'hermes' }), 'Map.groupBy')).toBe(true)
  })

  test('纯 ES5 代码 — 通过', () => {
    expect(check('f.js', 'var a = 1; function f() {}', { ...opts, target: 'hermes' })).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// DRN 专项规则
// ─────────────────────────────────────────────
describe('DRN 规则', () => {
  test('with 语句 — 报错（继承 hermes）', () => {
    expect(hasMsg(check('f.js', 'with ({}) {}', { ...opts, target: 'drn' }), 'with')).toBe(true)
  })

  test('class 声明 — 报错', () => {
    expect(check('f.js', 'class Foo {}', { ...opts, target: 'drn' }).length).toBeGreaterThan(0)
  })

  test('for await...of — 报错', () => {
    expect(check('f.js', 'async function f() { for await (const x of []) {} }', { ...opts, target: 'drn' }).length).toBeGreaterThan(0)
  })

  test('纯 ES5 代码 — 通过', () => {
    expect(check('f.js', 'var a = 1; function f() {}', { ...opts, target: 'drn' })).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// target 别名等价验证
// ─────────────────────────────────────────────
describe('target 别名等价', () => {
  test('es5 和 5 等价', () => {
    const code = 'let a = 1'
    expect(check('f.js', code, { ...opts, target: 'es5' }).length).toBe(
      check('f.js', code, { ...opts, target: '5' }).length
    )
  })

  test('es2015 / es6 / 6 等价', () => {
    const code = '2 ** 10'
    const a = check('f.js', code, { ...opts, target: 'es2015' }).length
    expect(check('f.js', code, { ...opts, target: 'es6' }).length).toBe(a)
    expect(check('f.js', code, { ...opts, target: '6' }).length).toBe(a)
  })

  test('target=es2022 对所有已知语法通过', () => {
    const code = `
      let a = 1; const b = 2
      const fn = () => 1
      const s = \`hi\`
      class Foo {}
      const n = 100n
      const x = null ?? 'x'
      let y = null; y ??= 1
      const z = 2 ** 3
    `
    expect(check('f.js', code, { ...opts, target: 'es2022' })).toHaveLength(0)
  })
})
