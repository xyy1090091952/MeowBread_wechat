const fs = require('fs');
const path = require('path');

// 定义数据库和词典文件的路径
const databaseDir = path.join(__dirname, '../database');
const dictionariesFile = path.join(databaseDir, 'dictionaries.js');

// 加载现有的词典数据
// 使用 delete require.cache 确保每次运行都加载最新文件
delete require.cache[require.resolve(dictionariesFile)];
const dictionariesData = require(dictionariesFile);
const dictionaries = dictionariesData.dictionaries;

// 创建一个字典 Map 以便快速查找
const dictMap = new Map(dictionaries.map(d => [d.id, d]));

// 获取 database 目录下的所有文件夹，每个文件夹代表一个词典
const dictDirs = fs.readdirSync(databaseDir).filter(file => {
    const filePath = path.join(databaseDir, file);
    // 过滤出文件夹，并排除隐藏文件夹和非文件夹（如 dictionaries.js 文件本身）
    return fs.statSync(filePath).isDirectory() && !file.startsWith('.');
});

// 遍历每个词典文件夹
for (const dictId of dictDirs) {
    const dirPath = path.join(databaseDir, dictId);
    
    // 查找或创建一个新的词典对象
    let dictionary = dictMap.get(dictId);
    if (!dictionary) {
        console.log(`发现新词典: ${dictId}，将自动添加到 dictionaries.js`);
        dictionary = {
            id: dictId,
            name: dictId, // 默认名称，可以后续手动修改
            description: `关于 ${dictId} 的描述`, // 默认描述
            lesson_files: [],
            volumes: [],
            courses: []
        };
        dictionaries.push(dictionary);
        dictMap.set(dictId, dictionary);
    }

    // 获取文件夹中所有的课程文件 (lesson*.js)，并按课程编号排序
    const lessonFiles = fs.readdirSync(dirPath)
        .filter(file => file.startsWith('lesson') && file.endsWith('.js'))
        .sort((a, b) => {
            const numA = parseInt(a.match(/lesson(\d+)/)[1], 10);
            const numB = parseInt(b.match(/lesson(\d+)/)[1], 10);
            return numA - numB;
        })
        .map(file => `${dictId}/${file}`);

    // 1. 更新 lesson_files 数组
    dictionary.lesson_files = lessonFiles;

    // 2. 更新 courses 数组
    const oldCourseMap = new Map((dictionary.courses || []).map(c => [c.lessonFile, c]));
    const newCourses = [];

    // 遍历课程文件，构建新的 courses 数组
    for (const lessonPath of lessonFiles) {
        const fileName = path.basename(lessonPath); // 例如: lesson1.js
        const lessonFile = fileName.replace('.js', ''); // 例如: lesson1
        
        const existingCourse = oldCourseMap.get(lessonFile);

        if (existingCourse) {
            // 如果课程已存在，保留现有信息（保留手动修改的标题和描述）
            newCourses.push(existingCourse);
        } else {
            // 如果是新课程，添加一个默认的课程对象
            console.log(`在 ${dictId} 中发现新课程: ${fileName}，将自动添加`);
            const match = lessonFile.match(/lesson(\d+)/);
            const courseNumber = match ? parseInt(match[1], 10) : null;

            if (courseNumber !== null) {
                // 统一设置默认标题格式
                const courseTitle = `第${courseNumber}课`;
                
                newCourses.push({
                    courseNumber: courseNumber,
                    courseTitle: courseTitle,
                    lessonFile: lessonFile,
                    description: '' // 描述留空，可手动填写
                });
            }
        }
    }
    
    // 按课程编号对 courses 数组进行排序
    newCourses.sort((a, b) => a.courseNumber - b.courseNumber);
    
    // 替换旧的 courses 数组
    dictionary.courses = newCourses;

    // 3. 更新 volumes 中的 lessons 数组
    // 如果词典只有一个 volume，则自动更新其 lessons 列表
    if (dictionary.volumes && dictionary.volumes.length === 1) {
        console.log(`正在为 ${dictId} 的单册自动更新课程列表...`);
        const allCourseNumbers = newCourses.map(c => c.courseNumber);
        dictionary.volumes[0].lessons = allCourseNumbers; // newCourses 已经排序，所以 allCourseNumbers 也是有序的
    }
}

// --- 自定义格式化输出 ---

// 创建一个深度克隆用于生成模板，避免修改原始数据
const dictionariesDataForTemplate = JSON.parse(JSON.stringify(dictionariesData));

// 遍历字典，用占位符替换需要特殊格式化的数组
dictionariesDataForTemplate.dictionaries.forEach(dict => {
    if (dict.volumes && dict.volumes.length > 0) {
        dict.volumes = `__VOLUMES_PLACEHOLDER_${dict.id}__`;
    }
    if (dict.courses && dict.courses.length > 0) {
        dict.courses = `__COURSES_PLACEHOLDER_${dict.id}__`;
    }
});

// 生成带占位符的、整体格式化好的JSON字符串
let newDictionariesContent = JSON.stringify(dictionariesDataForTemplate, null, 4);

// 遍历原始数据，生成我们期望的紧凑数组字符串，并替换占位符
dictionariesData.dictionaries.forEach(dict => {
    // 格式化 volumes 数组：每个 volume 对象占一行
    if (dict.volumes && dict.volumes.length > 0) {
        const volumesString = `[
${dict.volumes.map(volume => `            ${JSON.stringify(volume)}`).join(',\n')}
        ]`;
        newDictionariesContent = newDictionariesContent.replace(`"__VOLUMES_PLACEHOLDER_${dict.id}__"`, volumesString);
    }

    // 格式化 courses 数组：每个 course 对象占一行
    if (dict.courses && dict.courses.length > 0) {
        const coursesString = `[
${dict.courses.map(course => `            ${JSON.stringify(course)}`).join(',\n')}
        ]`;
        newDictionariesContent = newDictionariesContent.replace(`"__COURSES_PLACEHOLDER_${dict.id}__"`, coursesString);
    }
});

// 组合最终文件内容
const finalContent = 'module.exports = ' + newDictionariesContent + ';\n';

// 将更新后的内容写回 dictionaries.js 文件
fs.writeFileSync(dictionariesFile, finalContent, 'utf8');

console.log('dictionaries.js 已成功更新。');