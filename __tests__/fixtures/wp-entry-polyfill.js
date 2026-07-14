// Entry that imports a fake core-js polyfill — the polyfill itself uses Map.groupBy
var polyfill = require('./node_modules/core-js/modules/es.map.group-by.js');
module.exports = polyfill;
