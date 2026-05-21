// versionMap maps a target environment value to the first rule number to check.
// Semantics: "target=esX" means the output must not contain syntax from esX+1 onwards.
// e.g. target=es5  → check ES2015+(rule6~13)
//      target=es6  → check ES2016+(rule7~13)
//      target=es2021 → check ES2022+(rule13)
//      target=es2022 → nothing to check (all known syntax allowed)
export const versionMap: Record<string, string> = {
  es5: '6',
  5: '6',
  es6: '7',
  es7: '8',
  es8: '9',
  es9: '10',
  es10: '11',
  es11: '12',
  es12: '13',
  es13: '14', // nothing to check
  6: '7',
  7: '8',
  8: '9',
  9: '10',
  10: '11',
  11: '12',
  12: '13',
  13: '14', // nothing to check
  es2015: '7',
  es2016: '8',
  es2017: '9',
  es2018: '10',
  es2019: '11',
  es2020: '12',
  es2021: '13',
  es2022: '14', // nothing to check
  hermes: 'hermes',
  drn: 'drn'
}

export const HERMES_VERSION = 'hermes'
export const DRN_VERSION = 'drn'
