/**
 * @file 单词列表筛选记录管理器
 * @description 
 *   职责：管理每本词典的课程筛选记录，支持按词典ID存储和读取筛选状态
 *   特点：每本书的筛选记录独立存储，互不影响
 *   存储格式：{ dictionaryId: { selectedCourseRange, timestamp } }
 */

const WORD_LIST_FILTER_KEY = 'wordListFilters';

/**
 * 获取指定词典的筛选记录
 * @param {string} dictionaryId - 词典ID
 * @returns {object | null} - 返回该词典的筛选记录，如果不存在则返回 null
 */
function getWordListFilter(dictionaryId) {
  try {
    const allFilters = wx.getStorageSync(WORD_LIST_FILTER_KEY) || {};
    const filter = allFilters[dictionaryId] || null;
    
    if (filter) {
      console.log(`wordListFilterManager: 读取词典 ${dictionaryId} 的筛选记录:`, filter);
    }
    
    return filter;
  } catch (error) {
    console.error('wordListFilterManager: 读取筛选记录失败', error);
    return null;
  }
}

/**
 * 保存指定词典的筛选记录
 * @param {string} dictionaryId - 词典ID
 * @param {object} filterSettings - 筛选设置对象
 * @param {object} filterSettings.selectedCourseRange - 选中的课程范围
 * @param {string} filterSettings.selectedCourseRange.label - 显示标签
 * @param {string|number} filterSettings.selectedCourseRange.value - 课程值
 * @param {string} filterSettings.selectedCourseRange.volumeId - 分册ID
 * @param {string} filterSettings.selectedCourseRange.description - 描述信息
 */
function saveWordListFilter(dictionaryId, filterSettings) {
  try {
    // 读取现有的所有筛选记录
    const allFilters = wx.getStorageSync(WORD_LIST_FILTER_KEY) || {};
    
    // 更新指定词典的筛选记录
    allFilters[dictionaryId] = {
      selectedCourseRange: filterSettings.selectedCourseRange,
      timestamp: Date.now() // 记录保存时间
    };
    
    // 保存回本地存储
    wx.setStorageSync(WORD_LIST_FILTER_KEY, allFilters);
    
    console.log(`wordListFilterManager: 已保存词典 ${dictionaryId} 的筛选记录:`, allFilters[dictionaryId]);
  } catch (error) {
    console.error('wordListFilterManager: 保存筛选记录失败', error);
  }
}

/**
 * 清除指定词典的筛选记录
 * @param {string} dictionaryId - 词典ID
 */
function clearWordListFilter(dictionaryId) {
  try {
    const allFilters = wx.getStorageSync(WORD_LIST_FILTER_KEY) || {};
    
    if (allFilters[dictionaryId]) {
      delete allFilters[dictionaryId];
      wx.setStorageSync(WORD_LIST_FILTER_KEY, allFilters);
      console.log(`wordListFilterManager: 已清除词典 ${dictionaryId} 的筛选记录`);
    }
  } catch (error) {
    console.error('wordListFilterManager: 清除筛选记录失败', error);
  }
}

/**
 * 清除所有筛选记录
 */
function clearAllWordListFilters() {
  try {
    wx.removeStorageSync(WORD_LIST_FILTER_KEY);
    console.log('wordListFilterManager: 已清除所有单词列表筛选记录');
  } catch (error) {
    console.error('wordListFilterManager: 清除所有筛选记录失败', error);
  }
}

/**
 * 获取所有词典的筛选记录
 * @returns {object} - 返回所有词典的筛选记录
 */
function getAllWordListFilters() {
  try {
    return wx.getStorageSync(WORD_LIST_FILTER_KEY) || {};
  } catch (error) {
    console.error('wordListFilterManager: 读取所有筛选记录失败', error);
    return {};
  }
}

module.exports = {
  getWordListFilter,
  saveWordListFilter,
  clearWordListFilter,
  clearAllWordListFilters,
  getAllWordListFilters
};