/**
 * @file 筛选条件管理器 (仓库管理员)
 * @description 
 *   职责：只负责数据的存取（写入和读取本地缓存）。
 *   特点：不关心业务逻辑，只提供标准化的数据存取接口。
 *   比喻：像是应用的“仓库保管员”，根据指令存货、取货。
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