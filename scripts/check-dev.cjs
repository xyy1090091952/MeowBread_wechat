// Read-only project checks; no WeChat runtime required.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
let failures = 0;
function check(ok, message) {
  console.log(`${ok ? '✓' : '✗'} ${message}`);
  if (!ok) failures++;
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root);
for (const file of files.filter(file => file.endsWith('.json'))) {
  try { JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (err) { check(false, `${path.relative(root, file)}: ${err.message}`); }
}
check(failures === 0, 'JSON 配置可解析');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
let missingPages = 0;
for (const page of app.pages) {
  for (const ext of ['js', 'json', 'wxml', 'wxss']) {
    if (!fs.existsSync(path.join(root, `${page}.${ext}`))) {
      missingPages++; check(false, `${page}.${ext} 缺失`);
    }
  }
}
check(missingPages === 0, `${app.pages.length} 个页面的 JS/JSON/WXML/WXSS 文件齐全`);
let syntaxErrors = 0;
for (const file of files.filter(file => /\.(js|cjs)$/.test(file))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) { syntaxErrors++; check(false, result.stderr || file); }
}
check(syntaxErrors === 0, 'JavaScript 语法检查');
check(fs.existsSync('/Applications/wechatwebdevtools.app/Contents/MacOS/cli'), '微信开发者工具已安装（macOS）');
console.log('此检查不替代微信开发者工具编译、真机测试或网络资源验证。');
process.exitCode = failures ? 1 : 0;
