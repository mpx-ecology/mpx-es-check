const acorn = require('acorn')
module.exports = parseAsset

function parseAsset (content, ast) {
  if (!ast) {
    ast = acorn.parse(content, {
      sourceType: 'script',
      locations: true,
      // I believe in a bright future of ECMAScript!
      // Actually, it's set to `2050` to support the latest ECMAScript version that currently exists.
      // Seems like `acorn` supports such weird option value.
      ecmaVersion: 2050
    })
  }

  return {
    ast
  }
}
