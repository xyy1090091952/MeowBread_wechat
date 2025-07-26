/**
 * @file 学习进度管理器
 * @description 管理用户的单词学习进度，记录已背过的单词，更新学习状态
 * @author MeowBread Team
 */

const { WORD_STATUS } = require('./constants.js');

/**
 * 获取单词的唯一标识符
 * @param {object} wordData - 单词数据对象
 * @returns {string|null} 单词的唯一标识符，如果wordData无效则返回null
 */
function getWordId(wordData) {
  // 增加空值判断，确保wordData有效
  if (!wordData || typeof wordData !== 'object') {
    // 只在开发模式下输出错误日志，帮助调试
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.error('getWordId: 无效的单词数据', wordData);
    }
    return null;
  }
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
  // 增加空值判断
  if (!wordData) {
    // 静默处理空的单词信息，避免console刷屏
    return false;
  }
  try {
    const wordId = getWordId(wordData);
    if (!wordId) return false; // 如果无法获取wordId，则直接返回
    
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
      
      // 只在开发模式下输出成功日志
      if (wx.getDeviceInfo().platform === 'devtools') {
        console.log(`单词已标记为已背: ${wordData['假名'] || wordData['汉字']} (${dictionaryId})`);
      }
      return true;
    } else {
      // 只在开发模式下输出重复标记日志
      if (wx.getDeviceInfo().platform === 'devtools') {
        console.log(`单词已经是已背状态: ${wordData['假名'] || wordData['汉字']}`);
      }
      return false;
    }
  } catch (error) {
    // 只在开发模式下输出错误日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.error('标记单词为已背失败:', error);
    }
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
    
    // 只在开发模式下输出学习进度更新日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.log(`词典 ${dictionaryId} 学习进度已更新: ${learnedWords.length} 个单词`);
    }
  } catch (error) {
    // 只在开发模式下输出错误日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.error('更新学习进度失败:', error);
    }
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
    // 只在开发模式下输出错误日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.error('获取已背单词列表失败:', error);
    }
    return [];
  }
}

/**
 * 获取特定课程的已背单词列表
 * @param {string} dictionaryId - 词典ID
 * @param {string} lessonFile - 课程文件名（如 'lesson5'）
 * @returns {Array} 该课程的已背单词列表
 */
async function getLearnedWordsForCourse(dictionaryId, lessonFile) {
  try {
    // 获取该词典的所有已背单词
    const allLearnedWords = getLearnedWords(dictionaryId);
    
    // 异步加载课程文件，获取该课程的所有单词
    const courseWords = await require('./wordManager.js').getWordsByFilter({ lessonFiles: [lessonFile], dictionaryId });
    
    if (!Array.isArray(courseWords)) {
      // 只在开发模式下输出警告日志
      if (wx.getDeviceInfo().platform === 'devtools') {
        console.warn(`课程文件格式不正确或加载失败: ${dictionaryId}/${lessonFile}`);
      }
      return [];
    }
    
    // 创建课程单词的ID集合，用于快速查找
    const courseWordIds = new Set();
    courseWords.forEach(wordItem => {
      if (wordItem.data) {
        const wordId = getWordId(wordItem.data);
        courseWordIds.add(wordId);
      }
    });
    
    // 筛选出属于该课程的已背单词
    const courseLearnedWords = allLearnedWords.filter(learnedWord => {
      return courseWordIds.has(learnedWord.id);
    });
    
    return courseLearnedWords;
  } catch (error) {
    // 只在开发模式下输出错误日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.error(`获取课程 ${dictionaryId}/${lessonFile} 的已背单词失败:`, error);
    }
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
  // 增加空值判断
  if (!wordData) return false;
  try {
    const wordId = getWordId(wordData);
    if (!wordId) return false;
    const learnedKey = `learned_words_${dictionaryId}`;
    const learnedWords = wx.getStorageSync(learnedKey) || [];
    
    return learnedWords.some(item => item.id === wordId);
  } catch (error) {
    // 只在开发模式下输出错误日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.error('检查单词学习状态失败:', error);
    }
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

    // 仅返回已学数量。总数和进度的计算交给调用方处理，
    // 因为只有调用方（UI层）知道总数（可能来自网络）
    // 返回0值以防止现有调用方解构时出错
    return {
      learnedCount,
      totalCount: 0, // 调用方应使用自己的总数覆盖此值
      progress: 0,   // 调用方应根据自己的总数重新计算
    };
  } catch (error) {
    // 只在开发模式下输出错误日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.error('获取学习进度统计失败:', error);
    }
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
    
    // 只在开发模式下输出日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.log(`词典 ${dictionaryId} 的学习进度已重置`);
    }
    return true;
  } catch (error) {
    // 只在开发模式下输出错误日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.error('重置学习进度失败:', error);
    }
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
  
  // 只在开发模式下输出日志
  if (wx.getDeviceInfo().platform === 'devtools') {
    console.log(`批量标记完成: ${successCount}/${wordDataList.length} 个单词已标记为已背`);
  }
  return successCount;
}

/**
 * 将单词从已学列表中移除
 * @param {object} wordData - 要取消标记的单词对象
 * @param {string} dictionaryId - 词典ID
 */
function unmarkWordAsLearned(wordData, dictionaryId) {
  // 增加空值判断
  if (!wordData) {
    // 只在开发模式下输出错误日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.error('unmarkWordAsLearned: 尝试取消标记一个空的单词信息');
    }
    return false;
  }
  try {
    const wordId = getWordId(wordData);
    if (!wordId) return false;
    const learnedKey = `learned_words_${dictionaryId}`;
    let learnedWords = wx.getStorageSync(learnedKey) || [];

    const wordIndex = learnedWords.findIndex(item => item.id === wordId);

    if (wordIndex > -1) {
      learnedWords.splice(wordIndex, 1);
      wx.setStorageSync(learnedKey, learnedWords);
      updateLearningProgress(dictionaryId); // 同步更新学习进度计数
      // 只在开发模式下输出日志
      if (wx.getDeviceInfo().platform === 'devtools') {
        console.log(`单词已恢复为未背: ${wordData['假名'] || wordData['汉字']} (${dictionaryId})`);
      }
      return true;
    } else {
      // 只在开发模式下输出日志
      if (wx.getDeviceInfo().platform === 'devtools') {
        console.log(`单词未曾被标记为已背: ${wordData['假名'] || wordData['汉字']}`);
      }
      return false;
    }
  } catch (error) {
    // 只在开发模式下输出错误日志
    if (wx.getDeviceInfo().platform === 'devtools') {
      console.error('取消标记单词为已背失败:', error);
    }
    return false;
  }
}

module.exports = {
  markWordAsLearned,
  getLearnedWords,
  getLearnedWordsForCourse,
  isWordLearned,
  getLearningProgress,
  resetLearningProgress,
  markWordsAsLearned,
  unmarkWordAsLearned
};