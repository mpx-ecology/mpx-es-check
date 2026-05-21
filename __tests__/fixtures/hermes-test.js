// Test file for Hermes unsupported features (script mode, no import.meta)

// 1. with statement
with ({}) {}

// 2. Symbol.species / Symbol.unscopables
const species = Symbol.species
const unscopables = Symbol.unscopables

// 3. Object.groupBy / Map.groupBy
const grouped = Object.groupBy([1, 2, 3], x => x)
const mapGrouped = Map.groupBy([1, 2, 3], x => x)
