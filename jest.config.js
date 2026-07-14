/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/{unit,integration}/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json']
}
