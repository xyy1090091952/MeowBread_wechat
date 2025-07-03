/**
 * @file 学习进度管理器
 * @description 管理用户的单词学习进度，记录已背过的单词，更新学习状态
 * @author MeowBread Team
 */

const { WORD_STATUS } = require('./constants.js');

/**
 * 获取单词的唯一标识符
 * @param {object} wordData - 单词数据对象
 * @returns {string} 单词的唯一标识符
 */
function getWordId(wordData) {
  // 使用假名+汉字+中文作为唯一标识，确保同一个单词不会重复记录
  const kana = wordData['假名'] || '';
  const kanji = wordData['汉字'] || '';
  const meaning = wordData['中文'] || '';
  return `${kana}_${kanji}_${meaning}`.replace(/\s+/g, ''); // 去除空格
}

/**
 * 标记单词为已背状态
 * @param {object} wordData - 单词数据对象
 * @param {string} dictionaryId - 词典ID
 */
function markWordAsLearned(wordData, dictionaryId) {
  try {
    const wordId = getWordId(wordData);
    
    // 获取该词典的已背单词列表
    const learnedKey = `learned_words_${dictionaryId}`;
    let learnedWords = wx.getStorageSync(learnedKey) || [];
    
    // 检查是否已经记录过这个单词
    if (!learnedWords.some(item => item.id === wordId)) {
      // 添加新的已背单词记录
      const learnedRecord = {
        id: wordId,
        wordData: wordData,
        learnedAt: new Date().toISOString(), // 学习时间
        status: WORD_STATUS.MEMORIZED
      };
      
      learnedWords.push(learnedRecord);
      
      // 保存到本地存储
      wx.setStorageSync(learnedKey, learnedWords);
      
      // 更新词典的学习进度计数
      updateLearningProgress(dictionaryId);
      
      console.log(`单词已标记为已背: ${wordData['假名'] || wordData['汉字']} (${dictionaryId})`);
      return true;
    } else {
      console.log(`单词已经是已背状态: ${wordData['假名'] || wordData['汉字']}`);
      return false;
    }
  } catch (error) {
    console.error('标记单词为已背失败:', error);
    return false;
  }
}

/**
 * 更新词典的学习进度计数
 * @param {string} dictionaryId - 词典ID
 */
function updateLearningProgress(dictionaryId) {
  try {
    const learnedKey = `learned_words_${dictionaryId}`;
    const learnedWords = wx.getStorageSync(learnedKey) || [];
    
    // 更新老版本的learned计数字段（保持兼容性）
    const oldLearnedKey = `learned_${dictionaryId}`;
    wx.setStorageSync(oldLearnedKey, learnedWords.length);
    
    console.log(`词典 ${dictionaryId} 学习进度已更新: ${learnedWords.length} 个单词`);
  } catch (error) {
    console.error('更新学习进度失败:', error);
  }
}

/**
 * 获取已背单词列表
 * @param {string} dictionaryId - 词典ID，如果不传则获取所有词典的已背单词
 * @returns {Array} 已背单词列表
 */
function getLearnedWords(dictionaryId = null) {
  try {
    if (dictionaryId) {
      // 获取指定词典的已背单词
      const learnedKey = `learned_words_${dictionaryId}`;
      return wx.getStorageSync(learnedKey) || [];
    } else {
      // 获取所有词典的已背单词
      const allLearned = [];
      const keys = wx.getStorageInfoSync().keys;
      
      keys.forEach(key => {
        if (key.startsWith('learned_words_')) {
          const words = wx.getStorageSync(key) || [];
          allLearned.push(...words);
        }
      });
      
      return allLearned;
    }
  } catch (error) {
    console.error('获取已背单词列表失败:', error);
    return [];
  }
}

/**
 * 检查单词是否已经被标记为已背
 * @param {object} wordData - 单词数据对象
 * @param {string} dictionaryId - 词典ID
 * @returns {boolean} 是否已背
 */
function isWordLearned(wordData, dictionaryId) {
  try {
    const wordId = getWordId(wordData);
    const learnedKey = `learned_words_${dictionaryId}`;
    const learnedWords = wx.getStorageSync(learnedKey) || [];
    
    return learnedWords.some(item => item.id === wordId);
  } catch (error) {
    console.error('检查单词学习状态失败:', error);
    return false;
  }
}

/**
 * 获取词典的学习进度统计
 * @param {string} dictionaryId - 词典ID
 * @returns {object} 学习进度统计 {learnedCount: number, totalCount: number, progress: number}
 */
function getLearningProgress(dictionaryId) {
  try {
    const learnedWords = getLearnedWords(dictionaryId);
    const learnedCount = learnedWords.length;
    
    // 计算词典总单词数
    const db = require('../database/dictionaries.js').dictionaries;
    const dictionary = db.find(dict => dict.id === dictionaryId);
    
    let totalCount = 0;
    if (dictionary && dictionary.lesson_files) {
      dictionary.lesson_files.forEach(filePath => {
        try {
          const lesson = require('../database/' + filePath);
          if (Array.isArray(lesson)) {
            totalCount += lesson.length;
          } else if (Array.isArray(lesson.words)) {
            totalCount += lesson.words.length;
          }
        } catch (err) {
          console.warn('无法加载课时文件', filePath);
        }
      });
    }
    
    const progress = totalCount > 0 ? Math.floor((learnedCount / totalCount) * 100) : 0;
    
    return {
      learnedCount,
      totalCount,
      progress
    };
  } catch (error) {
    console.error('获取学习进度统计失败:', error);
    return { learnedCount: 0, totalCount: 0, progress: 0 };
  }
}

/**
 * 重置词典的学习进度
 * @param {string} dictionaryId - 词典ID
 */
function resetLearningProgress(dictionaryId) {
  try {
    const learnedKey = `learned_words_${dictionaryId}`;
    const oldLearnedKey = `learned_${dictionaryId}`;
    
    wx.removeStorageSync(learnedKey);
    wx.removeStorageSync(oldLearnedKey);
    
    console.log(`词典 ${dictionaryId} 的学习进度已重置`);
    return true;
  } catch (error) {
    console.error('重置学习进度失败:', error);
    return false;
  }
}

/**
 * 批量标记单词为已背（用于答题结束后批量处理）
 * @param {Array} wordDataList - 单词数据列表
 * @param {string} dictionaryId - 词典ID
 * @returns {number} 成功标记的单词数量
 */
function markWordsAsLearned(wordDataList, dictionaryId) {
  let successCount = 0;
  
  wordDataList.forEach(wordData => {
    if (markWordAsLearned(wordData, dictionaryId)) {
      successCount++;
    }
  });
  
  console.log(`批量标记完成: ${successCount}/${wordDataList.length} 个单词已标记为已背`);
  return successCount;
}

module.exports = {
  markWordAsLearned,
  getLearnedWords,
  isWordLearned,
  getLearningProgress,
  resetLearningProgress,
  markWordsAsLearned
}; 