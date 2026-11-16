// Keep the external JSON canonical; WeChat can require JS modules, not plain JSON.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = path.resolve(process.argv[2] || path.join(root, '../喵包词库/try_n1/lesson1.json'));
const words = JSON.parse(fs.readFileSync(source, 'utf8'));
assert(Array.isArray(words) && words.length > 0, 'Lesson must be a non-empty JSON array');
for (const { data } of words) {
  assert(data && data.假名 && data.中文 && data.例句 && data.词性, 'Missing word fields');
  assert(data.重点 === undefined || typeof data.重点 === 'boolean', '重点 must be boolean');
  for (const key of ['日语干扰词', '中文干扰词']) {
    assert(Array.isArray(data[key]) && data[key].length === 6 && new Set(data[key]).size === 6, `Invalid ${key}`);
  }
}
const destination = path.join(root, 'database/try_n1/lesson1.js');
fs.writeFileSync(destination, '// Generated from MeowBread_database/try_n1/lesson1.json.\nmodule.exports = ' + JSON.stringify(words, null, 2) + ';\n');
console.log(`Synced ${words.length} words to ${destination}`);
