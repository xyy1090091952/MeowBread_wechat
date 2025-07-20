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
  // 同时兼容 lessonFiles 和 selectedLessonFiles，增加健壮性
  const lessonIdentifiers = filter.lessonFiles || filter.selectedLessonFiles;
  let wordsToLoad = [];

  if (!lessonIdentifiers || lessonIdentifiers.length === 0) {
    console.warn('wordManager: 传入的 lessonFiles / selectedLessonFiles 为空，无法加载单词。');
    return [];
  }

  const dictionariesConfig = allDictionariesData.dictionaries;

  // 新增：一个根据文件名（如 'lesson1.json'）查找完整URL的辅助函数
  const findUrlByFileName = (fileName) => {
    for (const dict of dictionariesConfig) {
      const url = dict.lesson_files.find(u => u.endsWith(`/${fileName}`));
      if (url) {
        return { url, dict };
      }
    }
    return { url: null, dict: null };
  };

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
        wordsToLoad.push(...lessonData.map(item => {
          // 从 URL 中提取 lesson 名称，例如从 '.../lesson1.json' 提取 'lesson1'
          const lessonName = lessonFileUrl.substring(lessonFileUrl.lastIndexOf('/') + 1).replace('.json', '');
          // 将 'lesson1' 转换为数字 1
          const lessonNumber = parseInt(lessonName.replace('lesson', ''), 10);
          return {
            data: item.data,
            sourceDictionary: dict.id,
            // 如果转换失败（例如，文件名不是 lessonX.json），则保留原始名称
            lesson: isNaN(lessonNumber) ? lessonName : lessonNumber
          };
        }));
      } else {
        console.warn(`wordManager: 课程文件格式不正确或为空: ${lessonFileUrl}`);
      }
    } catch (e) {
      console.error(`wordManager: 无法加载课程文件: ${lessonFileUrl}`, e);
    }
  };

  const loadingPromises = [];

  for (const identifier of lessonIdentifiers) {
    if (identifier === 'ALL_DICTIONARIES_ALL_LESSONS') {
      for (const dict of dictionariesConfig) {
        if (dict.lesson_files && Array.isArray(dict.lesson_files)) {
          for (const url of dict.lesson_files) {
            loadingPromises.push(processLessonFile(dict, url));
          }
        }
      }
    } else if (identifier.startsWith('DICTIONARY_') && identifier.endsWith('_ALL_LESSONS')) {
      const parts = identifier.split('_');
      const targetDictId = parts.slice(1, parts.length - 2).join('_');
      const targetDictionary = dictionariesConfig.find(d => d.id === targetDictId);
      if (targetDictionary && targetDictionary.lesson_files) {
        for (const url of targetDictionary.lesson_files) {
          loadingPromises.push(processLessonFile(targetDictionary, url));
        }
      }
    } else {
      // 智能处理：identifier 可能是一个 URL，也可能是一个拼接的文件名
      let lessonUrl = null;
      let dictionary = null;

      // Case 1: identifier 本身就是完整的 URL
      if (identifier.startsWith('http')) {
        for (const dict of dictionariesConfig) {
          if (dict.lesson_files && dict.lesson_files.includes(identifier)) {
            lessonUrl = identifier;
            dictionary = dict;
            break;
          }
        }
      } 
      // Case 2: identifier 是 '教材_文件名' 格式，例如 'liangs_class_lesson1.json'
      else {
        const fileName = identifier.split('_').pop(); // 获取 'lesson1.json'
        const { url, dict } = findUrlByFileName(fileName);
        if (url) {
          lessonUrl = url;
          dictionary = dict;
        }
      }

      if (lessonUrl && dictionary) {
        loadingPromises.push(processLessonFile(dictionary, lessonUrl));
      } else {
        console.warn(`wordManager: 无法为课程文件标识 ${identifier} 找到匹配的词典或URL。`);
      }
    }
  }

  await Promise.all(loadingPromises);

  return wordsToLoad;
}

module.exports = {
  getWordsByFilter
};