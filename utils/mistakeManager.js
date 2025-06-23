/**
 * @file 错题库管理器
 * @description 封装所有与错题库（mistakeList）相关的本地存储操作，包括添加、更新、查询和移除。
 * @author MeowBread Team
 */

const { WORD_STATUS } = require('./constants.js');

const MISTAKE_LIST_KEY = 'mistakeList';

/**
 * 获取完整的错题列表
 * @returns {Array} - 错题列表
 */
function getMistakeList() {
  return wx.getStorageSync(MISTAKE_LIST_KEY) || [];
}

/**
 * 保存错题列表
 * @param {Array} list - 最新的错题列表
 */
function saveMistakeList(list) {
  wx.setStorageSync(MISTAKE_LIST_KEY, list);
}

/**
 * 将一个单词添加到错题库，如果它还不存在的话
 * @param {object} wordInfo - 包含完整单词信息的对象
 */
function addMistake(wordInfo) {
  const mistakes = getMistakeList();
  const existing = mistakes.find(item => {
    if (!item.data) return false;
    const kanjiMatch = (!wordInfo['汉字'] && !item.data['汉字']) || (wordInfo['汉字'] === item.data['汉字']);
    const kanaMatch = wordInfo['假名'] === item.data['假名'];
    return kanjiMatch && kanaMatch;
  });

  if (!existing) {
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
  const mistakes = getMistakeList();
  const mistakeIndex = mistakes.findIndex(item => {
    if (!item.data) return false;
    const kanjiMatch = (!wordInfo['汉字'] && !item.data['汉字']) || (wordInfo['汉字'] === item.data['汉字']);
    const kanaMatch = wordInfo['假名'] === item.data['假名'];
    return kanjiMatch && kanaMatch;
  });

  if (mistakeIndex !== -1 && (mistakes[mistakeIndex].status === WORD_STATUS.ERROR)) {
    mistakes[mistakeIndex].status = WORD_STATUS.CORRECTED;
    saveMistakeList(mistakes);
    console.log(`mistakeManager: 单词 "${wordInfo['汉字'] || wordInfo['假名']}" 状态已更新为 '修正'`);
  }
}

/**
 * 从错题库中移除已掌握的单词（状态为 'corrected' 或 'memorized'）
 * @returns {number} - 被移除的单词数量
 */
function clearCorrectedMistakes() {
  let mistakes = getMistakeList();
  const originalLength = mistakes.length;
  const filteredMistakes = mistakes.filter(item => item.status !== WORD_STATUS.CORRECTED && item.status !== WORD_STATUS.MEMORIZED);
  
  if (originalLength > filteredMistakes.length) {
    saveMistakeList(filteredMistakes);
  }
  
  return originalLength - filteredMistakes.length;
}


module.exports = {
  getMistakeList,
  addMistake,
  correctMistake,
  clearCorrectedMistakes
};