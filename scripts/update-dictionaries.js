const fs = require('fs');
const path = require('path');

const databaseDir = path.join(__dirname, '../database');
const dictionariesFile = path.join(__dirname, '../database/dictionaries.js');

const lessonsByDict = {};

fs.readdirSync(databaseDir).forEach(dir => {
  const dirPath = path.join(databaseDir, dir);
  if (fs.statSync(dirPath).isDirectory()) {
    lessonsByDict[dir] = [];
    fs.readdirSync(dirPath).forEach(file => {
      if (file.endsWith('.js')) {
        const relativePath = `${dir}/${file}`;
        lessonsByDict[dir].push(relativePath);
      }
    });
  }
});

// 为了保证格式的统一和可维护性，我们直接引入并修改对象，然后重新生成文件内容
delete require.cache[require.resolve(dictionariesFile)]; // 确保我们获取的是最新版本的文件
const dictionariesData = require(dictionariesFile);

// 更新每个词典的 lesson_files
dictionariesData.dictionaries.forEach(dict => {
  if (lessonsByDict[dict.id]) {
    dict.lesson_files = lessonsByDict[dict.id];
  }
});

// 生成新的文件内容，并保持良好的格式
const newDictionariesContent = 'module.exports = ' + JSON.stringify(dictionariesData, null, 4) + ';\n';

fs.writeFileSync(dictionariesFile, newDictionariesContent, 'utf8');
console.log('dictionaries.js updated successfully.');