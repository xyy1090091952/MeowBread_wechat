/**
 * @file 单词数据管理器
 * @description 封装所有与单词数据获取、筛选、处理相关的逻辑，为上层业务提供统一的数据接口。
 * @author MeowBread Team
 */

const allDictionariesData = require('../database/dictionaries.js');
const allLessons = require('../database/lesson-map.js');

/**
 * 根据筛选条件获取单词列表
 * @param {object} filter - 筛选条件，包含 lessonFiles, dictionaryId 等
 * @returns {Array} - 返回一个包含单词对象的数组，每个对象都增加了 sourceDictionary 和 lesson 字段
 */
function getWordsByFilter(filter) {
  const { lessonFiles } = filter;
  let wordsToLoad = [];

  if (!lessonFiles || lessonFiles.length === 0) {
    console.warn('wordManager: 传入的 lessonFiles 为空，无法加载单词。');
    return [];
  }

  const dictionariesConfig = allDictionariesData.dictionaries;

  const processLessonFile = (dict, lessonFileName) => {
    const fullPath = `${dict.id}/${lessonFileName}`;
    const lessonData = allLessons[fullPath];
    if (lessonData && Array.isArray(lessonData)) {
      wordsToLoad.push(...lessonData.map(item => ({
        data: item.data,
        sourceDictionary: dict.id,
        lesson: lessonFileName.replace('.js', '')
      })));
    } else {
      console.warn(`wordManager: 无法从预加载数据中找到课程: ${fullPath}`);
    }
  };

  lessonFiles.forEach(lessonFile => {
    if (lessonFile === 'ALL_DICTIONARIES_ALL_LESSONS') {
      dictionariesConfig.forEach(dict => {
        if (dict.lesson_files && Array.isArray(dict.lesson_files)) {
          dict.lesson_files.forEach(lessonPattern => {
            const lessonFileName = lessonPattern.split('/').pop();
            processLessonFile(dict, lessonFileName);
          });
        }
      });
    } else if (lessonFile.startsWith('DICTIONARY_') && lessonFile.endsWith('_ALL_LESSONS')) {
      const parts = lessonFile.split('_');
      const targetDictId = parts.slice(1, parts.length - 2).join('_');
      const targetDictionary = dictionariesConfig.find(d => d.id === targetDictId);
      if (targetDictionary && targetDictionary.lesson_files) {
        targetDictionary.lesson_files.forEach(fullPathPattern => {
          const lessonFileName = fullPathPattern.split('/').pop();
          processLessonFile(targetDictionary, lessonFileName);
        });
      }
    } else {
      let foundDictionary = false;
      for (const dict of dictionariesConfig) {
        if (lessonFile.startsWith(dict.id + '_')) {
          const lessonName = lessonFile.substring(dict.id.length + 1);
          const lessonFileName = `${lessonName}.js`;
          const fullPathPattern = `${dict.id}/${lessonFileName}`;
          if (dict.lesson_files && dict.lesson_files.includes(fullPathPattern)) {
            processLessonFile(dict, lessonFileName);
            foundDictionary = true;
            break;
          }
        }
      }
      if (!foundDictionary) {
        console.warn(`wordManager: 无法为课程文件标识 ${lessonFile} 找到匹配的词典。`);
      }
    }
  });

  return wordsToLoad;
}

module.exports = {
  getWordsByFilter
};