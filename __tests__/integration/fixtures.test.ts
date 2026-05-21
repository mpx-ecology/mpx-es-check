/**
 * 集成测试：基于 fixtures/ 目录下的真实 JS 文件验证规则
 *
 * 每个 fixture 只含对应版本的语法，验证：
 *   - target=<低于该版本>：报错（该语法不被允许）
 *   - target=<该版本及以上>：通过（该语法被允许）
 */
import path from 'path'
import fs from 'fs'
import { check } from '../../src/lib/index'

const FIXTURES = path.join(__dirname, '../fixtures')

function fixture (name: string): string {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf-8')
}

function passes (file: string, target: string): void {
  expect(check(file, fixture(file), { files: [], silent: true, target })).toHaveLength(0)
}

function fails (file: string, target: string): void {
  expect(check(file, fixture(file), { files: [], silent: true, target }).length).toBeGreaterThan(0)
}

// ─────────────────────────────────────────────
// es5.js — 纯 ES5，任何 target 都通过
// ─────────────────────────────────────────────
describe('fixture: es5.js', () => {
  const file = 'es5.js'
  test('target=es5 通过', () => passes(file, 'es5'))
  test('target=es2015 通过', () => passes(file, 'es2015'))
  test('target=es2022 通过', () => passes(file, 'es2022'))
})

// ─────────────────────────────────────────────
// es2015.js — 含 ES2015 语法
// ─────────────────────────────────────────────
describe('fixture: es2015.js', () => {
  const file = 'es2015.js'
  test('target=es5 报错', () => fails(file, 'es5'))
  test('target=es2015 通过', () => passes(file, 'es2015'))
  test('target=es2016 通过', () => passes(file, 'es2016'))
  test('target=es2022 通过', () => passes(file, 'es2022'))
})

// ─────────────────────────────────────────────
// es2016.js — 含 ES2016 语法（**）
// ─────────────────────────────────────────────
describe('fixture: es2016.js', () => {
  const file = 'es2016.js'
  test('target=es5 报错', () => fails(file, 'es5'))
  test('target=es2015 报错', () => fails(file, 'es2015'))
  test('target=es2016 通过', () => passes(file, 'es2016'))
  test('target=es2017 通过', () => passes(file, 'es2017'))
  test('target=es2022 通过', () => passes(file, 'es2022'))
})

// ─────────────────────────────────────────────
// es2017.js — 含 ES2017 语法（async/await）
// ─────────────────────────────────────────────
describe('fixture: es2017.js', () => {
  const file = 'es2017.js'
  test('target=es5 报错', () => fails(file, 'es5'))
  test('target=es2015 报错', () => fails(file, 'es2015'))
  test('target=es2016 报错', () => fails(file, 'es2016'))
  test('target=es2017 通过', () => passes(file, 'es2017'))
  test('target=es2018 通过', () => passes(file, 'es2018'))
  test('target=es2022 通过', () => passes(file, 'es2022'))
})

// ─────────────────────────────────────────────
// es2018.js — 含 ES2018 语法（对象展开、for await）
// ─────────────────────────────────────────────
describe('fixture: es2018.js', () => {
  const file = 'es2018.js'
  test('target=es5 报错', () => fails(file, 'es5'))
  test('target=es2015 报错', () => fails(file, 'es2015'))
  test('target=es2016 报错', () => fails(file, 'es2016'))
  test('target=es2017 报错', () => fails(file, 'es2017'))
  test('target=es2018 通过', () => passes(file, 'es2018'))
  test('target=es2019 通过', () => passes(file, 'es2019'))
  test('target=es2022 通过', () => passes(file, 'es2022'))
})

// ─────────────────────────────────────────────
// es2019.js — 含 ES2019 语法（可选 catch）
// ─────────────────────────────────────────────
describe('fixture: es2019.js', () => {
  const file = 'es2019.js'
  test('target=es5 报错', () => fails(file, 'es5'))
  test('target=es2015 报错', () => fails(file, 'es2015'))
  test('target=es2016 报错', () => fails(file, 'es2016'))
  test('target=es2017 报错', () => fails(file, 'es2017'))
  test('target=es2018 报错', () => fails(file, 'es2018'))
  test('target=es2019 通过', () => passes(file, 'es2019'))
  test('target=es2020 通过', () => passes(file, 'es2020'))
  test('target=es2022 通过', () => passes(file, 'es2022'))
})

// ─────────────────────────────────────────────
// es2020.js — 含 ES2020 语法（BigInt、?.、??）
// ─────────────────────────────────────────────
describe('fixture: es2020.js', () => {
  const file = 'es2020.js'
  test('target=es5 报错', () => fails(file, 'es5'))
  test('target=es2015 报错', () => fails(file, 'es2015'))
  test('target=es2016 报错', () => fails(file, 'es2016'))
  test('target=es2017 报错', () => fails(file, 'es2017'))
  test('target=es2018 报错', () => fails(file, 'es2018'))
  test('target=es2019 报错', () => fails(file, 'es2019'))
  test('target=es2020 通过', () => passes(file, 'es2020'))
  test('target=es2021 通过', () => passes(file, 'es2021'))
  test('target=es2022 通过', () => passes(file, 'es2022'))
})

// ─────────────────────────────────────────────
// es2021.js — 含 ES2021 语法（??=、||=、&&=）
// ─────────────────────────────────────────────
describe('fixture: es2021.js', () => {
  const file = 'es2021.js'
  test('target=es5 报错', () => fails(file, 'es5'))
  test('target=es2015 报错', () => fails(file, 'es2015'))
  test('target=es2016 报错', () => fails(file, 'es2016'))
  test('target=es2017 报错', () => fails(file, 'es2017'))
  test('target=es2018 报错', () => fails(file, 'es2018'))
  test('target=es2019 报错', () => fails(file, 'es2019'))
  test('target=es2020 报错', () => fails(file, 'es2020'))
  test('target=es2021 通过', () => passes(file, 'es2021'))
  test('target=es2022 通过', () => passes(file, 'es2022'))
})

// ─────────────────────────────────────────────
// hermes-test.js — 含 Hermes 不支持的语法
// ─────────────────────────────────────────────
describe('fixture: hermes-test.js', () => {
  const file = 'hermes-test.js'
  test('target=hermes 报错', () => fails(file, 'hermes'))
  test('target=drn 报错（继承 hermes 规则）', () => fails(file, 'drn'))
})
