/**
 * @file 错题库管理器
 * @description 封装所有与错题库相关的本地存储操作，使用全局唯一的错题列表。
 * @author MeowBread Team
 */

const { WORD_STATUS } = require('./constants.js');

// 使用一个全局唯一的键来存储所有错题
const MISTAKE_LIST_KEY = 'mistakeList_global';

/**
 * 获取全局错题列表
 * @returns {Array} - 错题列表
 */
function getMistakeList() {
  return wx.getStorageSync(MISTAKE_LIST_KEY) || [];
}

/**
 * 保存全局错题列表
 * @param {Array} list - 最新的错题列表
 */
function saveMistakeList(list) {
  wx.setStorageSync(MISTAKE_LIST_KEY, list);
}

/**
 * 将一个单词添加到全局错题库，或将其状态更新为“错误”
 * @param {object} wordInfo - 包含完整单词信息的对象
 */
function addMistake(wordInfo) {
  if (!wordInfo || !wordInfo['假名']) {
    console.error('addMistake: 尝试添加一个无效的单词信息', wordInfo);
    return;
  }
  const mistakes = getMistakeList();
  const mistakeIndex = mistakes.findIndex(item => {
    if (!item.data) return false;
    // 匹配逻辑：优先匹配汉字（如果存在），然后匹配假名
    const kanjiMatch = (!wordInfo['汉字'] && !item.data['汉字']) || (wordInfo['汉字'] === item.data['汉字']);
    const kanaMatch = wordInfo['假名'] === item.data['假名'];
    return kanjiMatch && kanaMatch;
  });

  if (mistakeIndex !== -1) {
    // 如果单词已存在于错题库中，检查其状态
    // 如果它当前不是“错误”状态（例如，是“已修正”），则将其更新为“错误”
    if (mistakes[mistakeIndex].status !== WORD_STATUS.ERROR) {
      mistakes[mistakeIndex].status = WORD_STATUS.ERROR;
      saveMistakeList(mistakes);
      console.log(`mistakeManager: 单词 "${wordInfo['汉字'] || wordInfo['假名']}" 状态已重新标记为 '错误'`);
    }
  } else {
    // 如果单词不存在，则将其作为新错题添加到列表中
    mistakes.push({ data: wordInfo, status: WORD_STATUS.ERROR });
    saveMistakeList(mistakes);
    console.log(`mistakeManager: 单词 "${wordInfo['汉字'] || wordInfo['假名']}" 已添加到错题库`);
  }
}

/**
 * 将一个错题的状态更新为“已修正”
 * @param {object} wordInfo - 包含完整单词信息的对象
 */
function correctMistake(wordInfo) {
  if (!wordInfo || !wordInfo['假名']) {
    console.error('correctMistake: 尝试修正一个无效的单词信息', wordInfo);
    return;
  }
  const mistakes = getMistakeList();
  const mistakeIndex = mistakes.findIndex(item => {
    if (!item.data) return false;
    const kanjiMatch = (!wordInfo['汉字'] && !item.data['汉字']) || (wordInfo['汉字'] === item.data['汉字']);
    const kanaMatch = wordInfo['假名'] === item.data['假名'];
    return kanjiMatch && kanaMatch;
  });

  // 只有当单词存在且状态为“错误”时，才将其更新为“已修正”
  if (mistakeIndex !== -1 && mistakes[mistakeIndex].status === WORD_STATUS.ERROR) {
    mistakes[mistakeIndex].status = WORD_STATUS.CORRECTED;
    saveMistakeList(mistakes);
    console.log(`mistakeManager: 单词 "${wordInfo['汉字'] || wordInfo['假名']}" 状态已更新为 '修正'`);
  }
}

/**
 * 从错题库中移除所有状态为“已修正”的单词
 * @returns {number} - 被移除的单词数量
 */
function clearCorrectedMistakes() {
  let mistakes = getMistakeList();
  const originalLength = mistakes.length;
  // 只保留状态不是“已修正”的单词
  const filteredMistakes = mistakes.filter(item => item.status !== WORD_STATUS.CORRECTED);
  
  if (originalLength > filteredMistakes.length) {
    saveMistakeList(filteredMistakes);
  }
  
  return originalLength - filteredMistakes.length;
}

/**
 * 从错题库中移除一个指定的单词
 * @param {object} wordInfo - 包含完整单词信息的对象
 */
function removeMistake(wordInfo) {
  if (!wordInfo || !wordInfo['假名']) {
    console.error('removeMistake: 尝试移除一个无效的单词信息', wordInfo);
    return;
  }
  let mistakes = getMistakeList();
  const originalLength = mistakes.length;
  const filteredMistakes = mistakes.filter(item => {
    if (!item.data) return true; // 保留格式不正确的数据，以防万一
    // 匹配逻辑：优先匹配汉字（如果存在），然后匹配假名
    const kanjiMatch = (!wordInfo['汉字'] && !item.data['汉字']) || (wordInfo['汉字'] === item.data['汉字']);
    const kanaMatch = wordInfo['假名'] === item.data['假名'];
    return !(kanjiMatch && kanaMatch); // 返回 false 以移除匹配项
  });

  if (originalLength > filteredMistakes.length) {
    saveMistakeList(filteredMistakes);
    console.log(`mistakeManager: 单词 "${wordInfo['汉字'] || wordInfo['假名']}" 已从错题库移除`);
  }
}

/**
 * 查询单个单词是否在错题库中
 * @param {object} wordInfo - 包含单词信息的对象
 * @returns {object|undefined} - 如果找到，返回错题项；否则返回undefined
 */
function getMistake(wordInfo) {
  if (!wordInfo) return undefined;
  const mistakes = getMistakeList();
  return mistakes.find(item => {
    if (!item.data) return false;
    const kanjiMatch = (!wordInfo['汉字'] && !item.data['汉字']) || (wordInfo['汉字'] === item.data['汉字']);
    const kanaMatch = wordInfo['假名'] === item.data['假名'];
    return kanjiMatch && kanaMatch;
  });
}

module.exports = {
  getMistakeList,
  addMistake,
  correctMistake,
  clearCorrectedMistakes,
  removeMistake, // 导出新函数
  getMistake
};