const fs = require('fs');
const path = require('path');

// database 目录的路径
const databaseDir = path.join(__dirname, '../database');

console.log('开始批量转换 JSON 文件...');

// 自动扫描 database 目录下的所有子目录
fs.readdirSync(databaseDir).forEach(dir => {
    const absoluteDir = path.join(databaseDir, dir);

    // 确保处理的是目录
    if (!fs.statSync(absoluteDir).isDirectory()) {
        return;
    }

    console.log(`正在处理目录: ${absoluteDir}`);

    const files = fs.readdirSync(absoluteDir);

    files.forEach(file => {
        if (path.extname(file) === '.json') {
            const oldFilePath = path.join(absoluteDir, file);
            const newFileName = path.basename(file, '.json') + '.js';
            const newFilePath = path.join(absoluteDir, newFileName);

            console.log(`正在转换文件: ${oldFilePath} -> ${newFilePath}`);

            try {
                const data = fs.readFileSync(oldFilePath, 'utf8');
                // 确保JSON数据是有效的
                JSON.parse(data);
                const newContent = `module.exports = ${data.trim()};`;
                fs.writeFileSync(newFilePath, newContent, 'utf8');
                console.log(`文件 ${newFilePath} 转换并保存成功。`);

                // 转换成功后删除旧的 .json 文件
                fs.unlinkSync(oldFilePath);
                console.log(`旧文件 ${oldFilePath} 已删除。`);

            } catch (err) {
                console.error(`处理文件 ${oldFilePath} 时出错:`, err);
            }
        }
    });
});

console.log('JSON 文件批量转换脚本执行完毕。请检查输出结果。');
