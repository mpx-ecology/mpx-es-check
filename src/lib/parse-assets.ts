import acorn from 'acorn'
import type { ASTNode } from '../types'

export interface ParseAssetResult {
  ast: ASTNode
}

function parseAsset (content: string, ast?: ASTNode): ParseAssetResult {
  if (!ast) {
    ast = acorn.parse(content, {
      sourceType: 'script',
      locations: true,
      ecmaVersion: 2050 as acorn.ecmaVersion
    }) as unknown as ASTNode
  }

  return {
    ast
  }
}

export default parseAsset
