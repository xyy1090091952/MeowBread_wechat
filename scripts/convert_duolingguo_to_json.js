// 导入 Node.js 内置的 'fs' (文件系统) 和 'path' (路径处理) 模块
const fs = require('fs');
const path = require('path');

// 定义源目录和目标目录的路径
// __dirname 是一个 Node.js 的全局变量，表示当前执行脚本所在的目录的绝对路径
const sourceDir = path.join(__dirname, '..', 'database', 'duolingguo');
const outputDir = path.join(__dirname, '..', 'database', 'json_output', 'duolingguo');

// --- 核心转换逻辑 ---

try {
  // 1. 检查并创建输出目录
  // recursive: true 选项确保如果父目录不存在，也会一并创建
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ 输出目录已创建: ${outputDir}`);
  }

  // 2. 读取源目录下的所有文件名
  const files = fs.readdirSync(sourceDir);
  console.log(`🔍 找到 ${files.length} 个文件，准备开始转换...`);

  let convertedCount = 0;

  // 3. 遍历每个文件
  files.forEach(file => {
    // 只处理 .js 文件
    if (path.extname(file) === '.js') {
      const sourceFilePath = path.join(sourceDir, file);
      
      // 使用 require() 直接加载 JS 文件，Node.js 会执行它并返回 module.exports 的内容
      const data = require(sourceFilePath);

      // 将 JS 对象/数组转换为格式化的 JSON 字符串
      // JSON.stringify 的第三个参数 '2' 表示使用 2 个空格进行缩进，使 JSON 文件更具可读性
      const jsonContent = JSON.stringify(data, null, 2);

      // 构建输出的 JSON 文件名 (例如: lesson1.js -> lesson1.json)
      const outputFileName = path.basename(file, '.js') + '.json';
      const outputFilePath = path.join(outputDir, outputFileName);

      // 4. 将 JSON 内容写入到新文件中
      fs.writeFileSync(outputFilePath, jsonContent, 'utf8');
      console.log(`🔄 成功: ${file}  ->  ${outputFileName}`);
      convertedCount++;
    }
  });

  console.log(`
🎉 转换完成！总共成功转换了 ${convertedCount} 个文件。`);
  console.log(`📂 所有 JSON 文件已保存至: ${outputDir}`);

} catch (error) {
  // 如果在过程中发生任何错误，打印错误信息
  console.error('❌ 转换过程中发生错误:', error);
}