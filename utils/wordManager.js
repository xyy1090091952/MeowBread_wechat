/**
 * @file 单词数据管理器
 * @description 封装所有与单词数据获取、筛选、处理相关的逻辑，为上层业务提供统一的数据接口。
 * @author MeowBread Team
 */

const allDictionariesData = require('../database/dictionaries.js');
/**
 * 根据筛选条件获取单词列表
 * @param {object} filter - 筛选条件，包含 lessonFiles, dictionaryId 等
 * @returns {Array} - 返回一个包含单词对象的数组，每个对象都增加了 sourceDictionary 和 lesson 字段
 */
async function getWordsByFilter(filter) {
  const { lessonFiles } = filter;
  let wordsToLoad = [];

  if (!lessonFiles || lessonFiles.length === 0) {
    console.warn('wordManager: 传入的 lessonFiles 为空，无法加载单词。');
    return [];
  }

  const dictionariesConfig = allDictionariesData.dictionaries;

  // 异步处理单个课程文件 URL
  const processLessonFile = async (dict, lessonFileUrl) => {
    try {
      // 使用 wx.request 发起网络请求获取 JSON 数据
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: lessonFileUrl,
          dataType: 'json',
          success: resolve,
          fail: reject
        });
      });

      const lessonData = res.data; // 获取请求返回的数据

      if (lessonData && Array.isArray(lessonData)) {
        wordsToLoad.push(...lessonData.map(item => ({
          data: item.data,
          sourceDictionary: dict.id,
          // 从 URL 中提取 lesson 名称，例如从 '.../lesson1.json' 提取 'lesson1'
          lesson: lessonFileUrl.substring(lessonFileUrl.lastIndexOf('/') + 1).replace('.json', '')
        })));
      } else {
        console.warn(`wordManager: 课程文件格式不正确或为空: ${lessonFileUrl}`);
      }
    } catch (e) {
      console.error(`wordManager: 无法加载课程文件: ${lessonFileUrl}`, e);
    }
  };

  const loadingPromises = [];

  for (const lessonFile of lessonFiles) {
    if (lessonFile === 'ALL_DICTIONARIES_ALL_LESSONS') {
      for (const dict of dictionariesConfig) {
        if (dict.lesson_files && Array.isArray(dict.lesson_files)) {
          for (const url of dict.lesson_files) {
            loadingPromises.push(processLessonFile(dict, url));
          }
        }
      }
    } else if (lessonFile.startsWith('DICTIONARY_') && lessonFile.endsWith('_ALL_LESSONS')) {
      const parts = lessonFile.split('_');
      const targetDictId = parts.slice(1, parts.length - 2).join('_');
      const targetDictionary = dictionariesConfig.find(d => d.id === targetDictId);
      if (targetDictionary && targetDictionary.lesson_files) {
        for (const url of targetDictionary.lesson_files) {
          loadingPromises.push(processLessonFile(targetDictionary, url));
        }
      }
    } else {
      // lessonFile is a URL now
      let foundDictionary = false;
      for (const dict of dictionariesConfig) {
        if (dict.lesson_files && dict.lesson_files.includes(lessonFile)) {
          loadingPromises.push(processLessonFile(dict, lessonFile));
          foundDictionary = true;
          break;
        }
      }
      if (!foundDictionary) {
        console.warn(`wordManager: 无法为课程文件URL ${lessonFile} 找到匹配的词典。`);
      }
    }
  }

  await Promise.all(loadingPromises);

  return wordsToLoad;
}

module.exports = {
  getWordsByFilter
};