// 导入 Node.js 内置的 'fs' (文件系统) 和 'path' (路径处理) 模块
const fs = require('fs');
const path = require('path');

// --- 1. 获取命令行参数 ---
// process.argv 是一个数组，包含了启动 Node.js 进程时的命令行参数
// 第一个元素是 'node'
// 第二个元素是正在执行的脚本的路径
// 从第三个元素开始，是传递给脚本的实际参数
const courseName = process.argv[2];

// 如果没有提供课程名称，则打印使用说明并退出
if (!courseName) {
  console.error('❌错误：请提供课程目录名作为参数！');
  console.log('使用方法: node scripts/convert_js_to_json.js <课程目录名>');
  console.log('例如: node scripts/convert_js_to_json.js duolingguo');
  process.exit(1); // 以错误码 1 退出
}

// --- 2. 定义源目录和目标目录的路径 ---
// 使用提供的课程名动态构建路径
const sourceDir = path.join(__dirname, '..', 'database', courseName);
const outputDir = path.join(__dirname, '..', 'database', 'json_output', courseName);

// --- 3. 核心转换逻辑 ---
try {
  // 检查源目录是否存在
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌错误：源目录不存在: ${sourceDir}`);
    process.exit(1);
  }

  // 检查并创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ 输出目录已创建: ${outputDir}`);
  }

  // 读取源目录下的所有文件名
  const files = fs.readdirSync(sourceDir);
  console.log(`🔍 在 '${courseName}' 目录中找到 ${files.length} 个文件，准备开始转换...`);

  let convertedCount = 0;

  // 遍历每个文件
  files.forEach(file => {
    // 只处理 .js 文件
    if (path.extname(file) === '.js') {
      const sourceFilePath = path.join(sourceDir, file);
      
      // 使用 require() 直接加载 JS 文件
      const data = require(sourceFilePath);

      // 转换为格式化的 JSON 字符串
      const jsonContent = JSON.stringify(data, null, 2);

      // 构建输出的 JSON 文件名
      const outputFileName = path.basename(file, '.js') + '.json';
      const outputFilePath = path.join(outputDir, outputFileName);

      // 将 JSON 内容写入到新文件中
      fs.writeFileSync(outputFilePath, jsonContent, 'utf8');
      console.log(`🔄 成功: ${file}  ->  ${outputFileName}`);
      convertedCount++;
    }
  });

  console.log(`
🎉 转换完成！'${courseName}' 课程总共成功转换了 ${convertedCount} 个文件。`);
  console.log(`📂 所有 JSON 文件已保存至: ${outputDir}`);

} catch (error) {
  // 如果在过程中发生任何错误，打印错误信息
  console.error('❌ 转换过程中发生错误:', error);
}