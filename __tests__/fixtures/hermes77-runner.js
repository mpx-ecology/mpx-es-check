// 简单的特性检测脚本：对每个特性，尝试用 new Function 编译并执行代码，报告编译或运行错误。
const testCases = [
  {
    name: 'Exponentiation ** and **=',
    code: "return (2 ** 3) === 8 && (function(){ let a = 2; a **= 3; return a === 8; })();"
  },
  {
    name: 'Logical assignment operators ||= &&= ??=',
    code: "var a = 0; a ||= 1; var b = 1; b &&= 2; var c = null; c ??= 'x'; return a === 1 && b === 2 && c === 'x';"
  },
  {
    name: 'Optional chaining (?.)',
    code: "var o = {a:{b:2}}; var p = null; return (o?.a?.b === 2) && (p?.a === undefined);"
  },
  {
    name: 'Nullish coalescing (??)',
    code: "var a = null ?? 'x'; return a === 'x';"
  },
  {
    name: 'BigInt literal (1n)',
    code: "return typeof 1n === 'bigint' && (12345678901234567890n + 0n) !== undefined;"
  },
  {
    name: 'Private class fields (#)',
    code: "class C{ #x = 1; get(){ return this.#x; } } return new C().get() === 1;"
  },
  {
    name: 'Optional catch binding',
    code: "try{ throw 1 } catch { return true }"
  },
  {
    name: 'Dynamic import (syntax + runtime)',
    code: "return (async function(){ try{ /* runtime may reject, we just observe */ await import('data:text/javascript,export default 1'); return 'import_ok' } catch(e) { return 'import_runtime_error:' + String(e) } })();"
  },
  {
    name: 'Regex /d flag (indices)',
    code: "try{ var r = new RegExp('a','d'); return 'RegExpConstructor OK' } catch(e){ try{ var r2 = /a/d; return 'literal OK' } catch(e2){ return 'both fail: ' + String(e2) } }"
  }
];

async function runAll() {
  for (const t of testCases) {
    let compiled = true;
    let result;
    try {
      const fn = new Function(t.code); // compile time
      try {
        const res = fn(); // may return Promise
        result = (res && typeof res.then === 'function') ? await res : res;
        console.log(`[PASS-COMPILE] ${t.name} ->`, result);
      } catch (runErr) {
        console.log(`[FAIL-RUNTIME] ${t.name} ->`, runErr && runErr.name ? (runErr.name + ': ' + runErr.message) : String(runErr));
      }
    } catch (compileErr) {
      compiled = false;
      console.log(`[FAIL-COMPILE] ${t.name} ->`, compileErr && compileErr.name ? (compileErr.name + ': ' + compileErr.message) : String(compileErr));
    }
  }
}

runAll().catch(e => {
  console.error('Runner fatal error:', e && e.stack ? e.stack : e);
  process.exit(2);
});
