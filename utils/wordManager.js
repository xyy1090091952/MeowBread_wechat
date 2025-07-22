/**
 * @file 单词数据管理器
 * @description 封装所有与单词数据获取、筛选、处理相关的逻辑，为上层业务提供统一的数据接口。
 * @author MeowBread Team
 */

const allDictionariesData = require('../database/dictionaries.js');
const wordCacheManager = require('./wordCacheManager.js'); // 引入缓存管理器
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
      // 🚀 优先从缓存中获取数据
      const cachedData = wordCacheManager.getCachedWords(lessonFileUrl);
      if (cachedData) {
        // 缓存命中，直接使用缓存数据
        wordsToLoad.push(...cachedData.map(item => {
          const lessonName = lessonFileUrl.substring(lessonFileUrl.lastIndexOf('/') + 1).replace('.json', '');
          const lessonNumber = parseInt(lessonName.replace('lesson', ''), 10);
          return {
            data: item.data,
            sourceDictionary: dict.id,
            lesson: isNaN(lessonNumber) ? lessonName : lessonNumber
          };
        }));
        return; // 缓存命中，直接返回
      }

      // 缓存未命中，从网络加载
      console.log(`从网络加载单词: ${lessonFileUrl}`);
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
        // 🎯 将数据存入缓存
        wordCacheManager.setCachedWords(lessonFileUrl, lessonData);
        
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
      // 使用第一个词典的所有课程作为默认
      const firstDict = dictionariesConfig[0];
      if (firstDict && firstDict.lesson_files && Array.isArray(firstDict.lesson_files)) {
        for (const url of firstDict.lesson_files) {
          loadingPromises.push(processLessonFile(firstDict, url));
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
      let cleanedIdentifier = identifier;

      // 修复BUG：增加防御性代码，处理上游可能传来的 'duolingguo_https://...' 这样的错误格式
      if (identifier.includes('_http')) {
        // 从 "http" 开始截取，得到一个干净的 URL
        cleanedIdentifier = identifier.substring(identifier.indexOf('http'));
      }

      // Case 1: identifier 本身就是完整的 URL
      if (cleanedIdentifier.startsWith('http')) {
        for (const dict of dictionariesConfig) {
          if (dict.lesson_files && dict.lesson_files.includes(cleanedIdentifier)) {
            lessonUrl = cleanedIdentifier;
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

/**
 * 获取并缓存词典的总词数
 * @param {string} dictionaryId - 词典ID
 * @returns {Promise<number>} - 返回一个包含总词数的Promise
 */
async function getDictionaryWordCount(dictionaryId) {
  const cacheKey = `word_count_cache_${dictionaryId}`;
  try {
    // 1. 尝试从缓存中读取
    const cachedCount = wx.getStorageSync(cacheKey);
    if (cachedCount) {
      return cachedCount;
    }

    // 2. 如果缓存中没有，则计算
    const dictionary = allDictionariesData.dictionaries.find(d => d.id === dictionaryId);
    if (!dictionary || !dictionary.lesson_files) {
      return 0;
    }

    let totalCount = 0;
    const countPromises = dictionary.lesson_files.map(lessonFileUrl => {
      return new Promise((resolve) => {
        wx.request({
          url: lessonFileUrl,
          dataType: 'json',
          success: (res) => {
            if (res.data && Array.isArray(res.data)) {
              resolve(res.data.length);
            } else {
              resolve(0);
            }
          },
          fail: () => {
            resolve(0);
          }
        });
      });
    });

    const counts = await Promise.all(countPromises);
    totalCount = counts.reduce((sum, count) => sum + count, 0);

    // 3. 将结果存入缓存
    wx.setStorageSync(cacheKey, totalCount);

    return totalCount;
  } catch (error) {
    console.error(`计算词典 ${dictionaryId} 总词数失败:`, error);
    return 0; // 出错时返回0
  }
}


module.exports = {
  getWordsByFilter,
  getDictionaryWordCount,
  // 缓存管理功能
  getCacheStats: wordCacheManager.getCacheStats,
  clearAllCache: wordCacheManager.clearAllCache,
  cleanExpiredCache: wordCacheManager.cleanExpiredCache
};