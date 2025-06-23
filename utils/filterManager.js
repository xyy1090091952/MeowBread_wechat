/**
 * @file 筛选条件管理器
 * @description 封装所有与筛选条件（quizFilter）相关的本地存储操作。
 * @author MeowBread Team
 */

const FILTER_KEY = 'quizFilter';

/**
 * 获取已保存的筛选条件
 * @returns {object | null} - 返回保存的筛选条件对象，如果不存在则返回 null
 */
function getFilter() {
  return wx.getStorageSync(FILTER_KEY) || null;
}

/**
 * 保存筛选条件
 * @param {object} filterSettings - 要保存的筛选条件对象
 */
function saveFilter(filterSettings) {
  wx.setStorageSync(FILTER_KEY, filterSettings);
  console.log('filterManager: 筛选条件已保存。', filterSettings);
}

/**
 * 清除已保存的筛选条件
 */
function clearFilter() {
  wx.removeStorageSync(FILTER_KEY);
  console.log('filterManager: 筛选条件已清除。');
}

module.exports = {
  getFilter,
  saveFilter,
  clearFilter
};