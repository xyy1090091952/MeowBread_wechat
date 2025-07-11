// utils/statusManager.js

/**
 * @file 状态管理工具
 * @description 统一处理单词、题目等的状态映射，提供可复用的状态处理函数。
 */

const { WORD_STATUS } = require('./constants.js');

// 定义状态的文本和样式
const STATUS_MAP = {
  [WORD_STATUS.UNSEEN]: { text: '未背', class: 'status-unseen' },
  [WORD_STATUS.ERROR]: { text: '错误', class: 'status-error' },
  [WORD_STATUS.CORRECTED]: { text: '修正', class: 'status-corrected' },
  [WORD_STATUS.MEMORIZED]: { text: '已背', class: 'status-memorized' }
};

/**
 * 为单词对象附加格式化后的状态信息
 * @param {object} wordItem - 原始单词对象，应包含一个 status 字段
 * @returns {object} - 返回附加了 statusText 和 statusClass 的新对象
 */
function processWordStatus(wordItem) {
  // 确保 statusKey 是一个有效的值，如果不是，则默认为 'unseen'
  const statusKey = wordItem && wordItem.status && STATUS_MAP[wordItem.status] 
    ? wordItem.status 
    : WORD_STATUS.UNSEEN;
  
  const statusInfo = STATUS_MAP[statusKey];
  
  // 使用扩展运算符(...)来创建一个新对象，避免直接修改原对象
  return {
    ...wordItem,
    statusText: statusInfo.text,
    statusClass: statusInfo.class
  };
}

module.exports = {
  processWordStatus,
  STATUS_MAP
};