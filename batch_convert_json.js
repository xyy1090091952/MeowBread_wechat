const fs = require('fs');
const path = require('path');

// 需要处理的目录路径
const directoriesToProcess = [
    'database/everyones_japanese',
    'database/liangs_class'
];

// 项目根目录
const projectRoot = __dirname; // 脚本文件位于项目根目录

console.log('开始批量转换 JSON 文件...');

directoriesToProcess.forEach(dir => {
    const absoluteDir = path.join(projectRoot, dir);
    console.log(`正在处理目录: ${absoluteDir}`);

    fs.readdir(absoluteDir, (err, files) => {
        if (err) {
            console.error(`读取目录 ${absoluteDir} 失败:`, err);
            return;
        }

        files.forEach(file => {
            if (path.extname(file) === '.json') {
                const oldFilePath = path.join(absoluteDir, file);
                const newFileName = path.basename(file, '.json') + '.js';
                const newFilePath = path.join(absoluteDir, newFileName);

                console.log(`正在转换文件: ${oldFilePath} -> ${newFilePath}`);

                fs.readFile(oldFilePath, 'utf8', (readErr, data) => {
                    if (readErr) {
                        console.error(`读取文件 ${oldFilePath} 失败:`, readErr);
                        return;
                    }

                    // 确保JSON数据是有效的，这里简单地尝试解析，更健壮的做法是添加更详细的错误处理
                    try {
                        JSON.parse(data);
                    } catch (parseErr) {
                        console.error(`文件 ${oldFilePath} 不是有效的JSON格式:`, parseErr);
                        return;
                    }

                    const newContent = `module.exports = ${data.trim()};`;

                    fs.writeFile(newFilePath, newContent, 'utf8', (writeErr) => {
                        if (writeErr) {
                            console.error(`写入文件 ${newFilePath} 失败:`, writeErr);
                            return;
                        }
                        console.log(`文件 ${newFilePath} 转换并保存成功。`);

                        // 可选：删除旧的 .json 文件
                        // fs.unlink(oldFilePath, (deleteErr) => {
                        //     if (deleteErr) {
                        //         console.error(`删除旧文件 ${oldFilePath} 失败:`, deleteErr);
                        //     } else {
                        //         console.log(`旧文件 ${oldFilePath} 已删除。`);
                        //     }
                        // });
                    });
                });
            }
        });
    });
});

console.log('JSON 文件批量转换脚本执行完毕。请检查输出结果。');
