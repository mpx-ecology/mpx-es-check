# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build TypeScript source to dist/
npm run build

# Run unit tests (Jest)
npm test

# Lint the codebase
npm run lint

# Auto-fix lint issues
npm run fix

# Run the CLI tool directly (local dev, after build)
node dist/index.js --module --target=es5 './tests/*.js'

# Run as globally-installed CLI
mpx-es-check --module --target=es5 './dist/*.js'
```

Unit tests run automatically as a pre-commit hook (`npm test`). Tests live in `__tests__/check.test.ts` and use Jest + ts-jest.

## Architecture

`@mpxjs/es-check` is a JavaScript build artifact compatibility checker for Mpx projects. It catches ES6+ syntax/API usage that Babel failed to transpile, preventing runtime errors on older environments.

### Directory structure

```
src/
  index.ts               # CLI entry point
  types/
    index.ts             # Shared interfaces: Problem, Rule, RuleContext, SafeEmitter, ASTNode
    core-js-compat.d.ts  # Local module declaration for core-js-compat
  lib/
    constant.ts          # target string → first rule number mapping
    collect-rule.ts      # Rule collection logic
    check.ts             # AST traversal + rule dispatch
    format.ts            # ESLint-style output formatting + sourcemap application
    util.ts              # Log output path helper
    create-problem.ts    # Problem object factory
    safe-emitter.ts      # Event emitter for rule listeners
    node-event-generator.ts  # AST node → selector matching (adapted from ESLint)
    parse-assets.ts      # acorn-based AST parser (plugin mode)
    webpack-plugin.ts    # Webpack plugin (EsCheckPlugin)
    index.ts             # Core CLI logic + Node.js API (parseCode / check)
    definitions.ts       # core-js-compat property mappings (BuiltIns, InstanceProperties, StaticProperties)
  rules/
    ecma2015.ts ~ ecma2022.ts   # Syntax rules per ES version
    methodRules.ts              # Instance/static method + built-in object checks
    miniprogramRules.ts         # WeChat miniprogram properties shape validation
    hermesRules.ts              # Hermes engine unsupported syntax/API rules
    drnRules.ts                 # DRN engine rules (extends Hermes + class + more)
dist/                    # tsc output (gitignored)
__tests__/
  check.test.ts          # Jest unit tests (45 cases covering ES2015~ES2022 + hermes + drn)
tests/                   # Manual test JS fixtures (gitignored)
```

### Two usage modes

**1. CLI mode** (`src/index.ts` → `src/lib/index.ts`):
- Accepts glob patterns for JS files to check
- Uses `@babel/parser` to parse code into AST
- Reads sourcemaps (`.map` files) to map problems back to original source
- Also exposed as Node.js API via `require('@mpxjs/es-check')`

**2. Webpack plugin mode** (`src/lib/webpack-plugin.ts` → `EsCheckPlugin`):
- Accessible via `require('@mpxjs/es-check/webpack-plugin')`
- Hooks into webpack's `emit` stage (stage 2000, after assets are stable)
- Reuses AST from `mpx.assetsASTsMap` when available (set by mpx-webpack-plugin)
- Uses `acorn` (not `@babel/parser`) for AST parsing — avoids re-parsing for performance
- Uses webpack's cache system (`compilation.getCache`) to skip unchanged chunks (keyed by `chunk.contentHash.javascript`)
- Block problems (errors) fail the build; non-block problems (warnings) are passed to `customRules.callback`
- Requires webpack 5

### Rule pipeline (`src/lib/check.ts`)

Rules are ESLint-style: each exports `{ meta, create(context) }`. The `create` function returns an object mapping AST node type selectors to visitor functions. `context.report()` creates a problem entry.

AST traversal uses `@babel/traverse` in CLI mode and `estraverse` in plugin mode. The `NodeEventGenerator` + `SafeEmitter` pair (adapted from ESLint internals) dispatch node events to registered rule listeners.

### Rule collection (`src/lib/collect-rule.ts`)

When `--target` is provided: maps the target to a starting rule number, then loads rules from that version up to the latest (ecma2022). Semantics: `--target=esX` means the output must not contain syntax from esX+1 onwards. Special values `hermes` and `drn` load their dedicated rule sets instead.

When no target is provided: reads the project's Babel config via `babel.loadPartialConfig()` and `core-js-compat` to determine which transforms/polyfills are needed, then only flags syntax/APIs that Babel should have but didn't transform.

### Target mapping (`src/lib/constant.ts`)

| Input | Target env | First rule checked |
|---|---|---|
| `5` / `es5` | ES5 | ecma2015 (rule6) |
| `6` / `es6` / `es2015` | ES2015 | ecma2016 (rule7) |
| `7` / `es7` / `es2016` | ES2016 | ecma2017 (rule8) |
| ... | ... | ... |
| `13` / `es13` / `es2022` | ES2022 | none |
| `hermes` | Hermes engine | hermesRules |
| `drn` | DRN engine | drnRules |

### Rule files (`src/rules/`)

- `ecma2015.ts` through `ecma2022.ts` — AST-based syntax rules (let/const, arrow functions, classes, template literals, etc.)
- `methodRules.ts` — Checks for untransformed instance methods, static methods, and built-in objects using `core-js-compat`'s `InstanceProperties`, `StaticProperties`, and `BuiltIns` mappings from `src/lib/definitions.ts`
- `miniprogramRules.ts` — WeChat miniprogram-specific: validates `properties` declarations have correct shape (`type` field required, no empty object/non-standard values)
- `hermesRules.ts` — Hermes engine: disallows `with`, `import.meta`, `Symbol.species`, `Symbol.unscopables`, `Object.groupBy`, `Map.groupBy`
- `drnRules.ts` — DRN engine: extends Hermes rules, additionally disallows class syntax, `for await...of`, dynamic `import()`, `FinalizationRegistry`, `Array.prototype.toSorted`, `Promise.withResolvers`, `ArrayBuffer.prototype.resize`, `structuredClone`

### Known issue: ES2022 private class fields in CLI mode

`ecma2022.ts` listens for `PropertyDefinition` (ESTree spec), but `@babel/parser` emits `ClassPrivateProperty` / `ClassPrivateMethod` for private fields. This means private class field rules are only effective in webpack plugin mode (which uses `acorn` / ESTree AST), not in CLI mode.

### Problem severity

- Default (no `type`): blocking error — causes non-zero exit / webpack build error
- `type: 'warning'`: non-blocking — logged as WARNING, doesn't fail the build unless `--all` is used in CLI mode

### Output

- CLI: no file output by default. Pass `--output <path>` to write results to a log file. Errors are printed to stdout in ESLint-style format; internal errors (sourcemap parse failures, file I/O errors) go to stderr.
- Plugin: block problems appear in webpack's `compilation.errors`. If `options.filename` is set, plain-text results are also written to `<outputPath>/<filename>`; no file is written otherwise.
- Both modes are silent on success (no output, exit 0).

### Key import notes (TypeScript migration)

- `@babel/parser`: use `import * as parser from '@babel/parser'` (no default export)
- `@babel/traverse` / `@babel/core`: use `require()` due to CJS interop
- `source-map` v0.5: `SourceMapConsumer` is synchronous; typed with a local interface
- `estraverse`: traverse types use `import('estree').Node`
- `esquery`: use `esquery.Selector` for parsed selector type


## 提交代码

提交代码前必须运行 build\test\lint检查，全都通过后才能提交