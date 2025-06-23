const { WORD_STATUS } = require('./constants.js');

/**
 * @description 错题本管理模块，负责错题的增、删、改、查
 */
const mistakeManager = {
  /**
   * @description 获取所有错题
   * @returns {Array} 错题列表
   */
  getMistakes: function() {
    return wx.getStorageSync('mistakeList') || [];
  },

  /**
   * @description 添加一个新错题。如果单词已存在，则不重复添加。
   * @param {object} wordInfo - 完整的单词信息对象
   */
  addMistake: function(wordInfo) {
    const mistakes = this.getMistakes();
    const existing = mistakes.find(item => {
      if (!item.data) return false;
      const kanjiMatch = (!wordInfo['汉字'] && !item.data['汉字']) || (wordInfo['汉字'] === item.data['汉字']);
      const kanaMatch = wordInfo['假名'] === item.data['假名'];
      return kanjiMatch && kanaMatch;
    });

    if (!existing) {
      mistakes.push({ data: wordInfo, status: WORD_STATUS.ERROR });
      wx.setStorageSync('mistakeList', mistakes);
      console.log(`单词 "${wordInfo['汉字'] || wordInfo['假名']}" 已添加到错题库`);
    }
  },

  /**
   * @description 将一个单词的状态从 'error' 更新为 'corrected'。
   * @param {object} wordInfo - 完整的单词信息对象
   */
  correctMistake: function(wordInfo) {
    const mistakes = this.getMistakes();
    const mistakeIndex = mistakes.findIndex(item => {
      if (!item.data) return false;
      const kanjiMatch = (!wordInfo['汉字'] && !item.data['汉字']) || (wordInfo['汉字'] === item.data['汉字']);
      const kanaMatch = wordInfo['假名'] === item.data['假名'];
      return kanjiMatch && kanaMatch;
    });

    if (mistakeIndex !== -1 && (mistakes[mistakeIndex].status === WORD_STATUS.ERROR)) {
      mistakes[mistakeIndex].status = WORD_STATUS.CORRECTED;
      wx.setStorageSync('mistakeList', mistakes);
      console.log(`单词 "${wordInfo['汉字'] || wordInfo['假名']}" 状态已更新为 '修正'`);
    }
  },

  /**
   * @description 从错题本中移除一个单词
   * @param {object} wordInfo - 完整的单词信息对象
   */
  removeMistake: function(wordInfo) {
    let mistakes = this.getMistakes();
    const initialCount = mistakes.length;
    mistakes = mistakes.filter(item => {
        if (!item.data) return true; // 保留没有数据的项，避免意外删除
        const kanjiMatch = (!wordInfo['汉字'] && !item.data['汉字']) || (wordInfo['汉字'] !== item.data['汉字']);
        const kanaMatch = wordInfo['假名'] !== item.data['假名'];
        return kanjiMatch || kanaMatch;
    });

    if (mistakes.length < initialCount) {
        wx.setStorageSync('mistakeList', mistakes);
        console.log(`单词 "${wordInfo['汉字'] || wordInfo['假名']}" 已从错题库移除`);
    }
  }
};

module.exports = mistakeManager;