/**
 * @file 单词库缓存管理器
 * @description 管理单词库的本地缓存，减少网络请求，提升用户体验
 * @author MeowBread Team
 */

/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  // 缓存版本号，用于强制更新缓存
  VERSION: '1.0.0',
  // 缓存过期时间（7天，单位：毫秒）
  EXPIRE_TIME: 7 * 24 * 60 * 60 * 1000,
  // 缓存键前缀
  CACHE_PREFIX: 'word_cache_',
  // 版本信息键
  VERSION_KEY: 'word_cache_version',
  // 缓存时间戳键后缀
  TIMESTAMP_SUFFIX: '_timestamp'
};

/**
 * 生成缓存键
 * @param {string} lessonUrl - 课程文件URL
 * @returns {string} 缓存键
 */
function generateCacheKey(lessonUrl) {
  // 从URL中提取唯一标识符
  const urlParts = lessonUrl.split('/');
  const dictId = urlParts[urlParts.length - 2]; // 词典ID
  const fileName = urlParts[urlParts.length - 1]; // 文件名
  return `${CACHE_CONFIG.CACHE_PREFIX}${dictId}_${fileName}`;
}

/**
 * 生成时间戳键
 * @param {string} cacheKey - 缓存键
 * @returns {string} 时间戳键
 */
function generateTimestampKey(cacheKey) {
  return `${cacheKey}${CACHE_CONFIG.TIMESTAMP_SUFFIX}`;
}

/**
 * 检查缓存是否过期
 * @param {string} cacheKey - 缓存键
 * @returns {boolean} 是否过期
 */
function isCacheExpired(cacheKey) {
  try {
    const timestampKey = generateTimestampKey(cacheKey);
    const timestamp = wx.getStorageSync(timestampKey);
    
    if (!timestamp) {
      return true; // 没有时间戳，认为过期
    }
    
    const now = Date.now();
    return (now - timestamp) > CACHE_CONFIG.EXPIRE_TIME;
  } catch (error) {
    console.warn('检查缓存过期时间失败:', error);
    return true; // 出错时认为过期
  }
}

/**
 * 检查缓存版本是否匹配
 * @returns {boolean} 版本是否匹配
 */
function isCacheVersionValid() {
  try {
    const cachedVersion = wx.getStorageSync(CACHE_CONFIG.VERSION_KEY);
    return cachedVersion === CACHE_CONFIG.VERSION;
  } catch (error) {
    console.warn('检查缓存版本失败:', error);
    return false;
  }
}

/**
 * 从缓存中获取单词数据
 * @param {string} lessonUrl - 课程文件URL
 * @returns {Array|null} 缓存的单词数据，如果没有或过期则返回null
 */
function getCachedWords(lessonUrl) {
  try {
    // 检查版本是否匹配
    if (!isCacheVersionValid()) {
      console.log('缓存版本不匹配，需要清理缓存');
      clearAllCache();
      return null;
    }
    
    const cacheKey = generateCacheKey(lessonUrl);
    
    // 检查是否过期
    if (isCacheExpired(cacheKey)) {
      console.log(`缓存已过期: ${lessonUrl}`);
      // 删除过期的缓存
      wx.removeStorageSync(cacheKey);
      wx.removeStorageSync(generateTimestampKey(cacheKey));
      return null;
    }
    
    // 获取缓存数据
    const cachedData = wx.getStorageSync(cacheKey);
    if (cachedData && Array.isArray(cachedData)) {
      console.log(`从缓存加载单词: ${lessonUrl}`);
      return cachedData;
    }
    
    return null;
  } catch (error) {
    console.warn('获取缓存单词数据失败:', error);
    return null;
  }
}

/**
 * 将单词数据存入缓存
 * @param {string} lessonUrl - 课程文件URL
 * @param {Array} wordsData - 单词数据
 */
function setCachedWords(lessonUrl, wordsData) {
  try {
    if (!wordsData || !Array.isArray(wordsData)) {
      console.warn('无效的单词数据，不进行缓存');
      return;
    }
    
    const cacheKey = generateCacheKey(lessonUrl);
    const timestampKey = generateTimestampKey(cacheKey);
    const now = Date.now();
    
    // 存储数据和时间戳
    wx.setStorageSync(cacheKey, wordsData);
    wx.setStorageSync(timestampKey, now);
    
    // 更新版本信息
    wx.setStorageSync(CACHE_CONFIG.VERSION_KEY, CACHE_CONFIG.VERSION);
    
    console.log(`单词数据已缓存: ${lessonUrl}, 数量: ${wordsData.length}`);
  } catch (error) {
    console.error('缓存单词数据失败:', error);
  }
}

/**
 * 清理所有缓存
 */
function clearAllCache() {
  try {
    const storageInfo = wx.getStorageInfoSync();
    const keysToRemove = storageInfo.keys.filter(key => 
      key.startsWith(CACHE_CONFIG.CACHE_PREFIX) || 
      key === CACHE_CONFIG.VERSION_KEY
    );
    
    keysToRemove.forEach(key => {
      wx.removeStorageSync(key);
    });
    
    console.log(`已清理 ${keysToRemove.length} 个缓存项`);
  } catch (error) {
    console.error('清理缓存失败:', error);
  }
}

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计信息
 */
function getCacheStats() {
  try {
    const storageInfo = wx.getStorageInfoSync();
    const cacheKeys = storageInfo.keys.filter(key => 
      key.startsWith(CACHE_CONFIG.CACHE_PREFIX)
    );
    
    const dataKeys = cacheKeys.filter(key => 
      !key.endsWith(CACHE_CONFIG.TIMESTAMP_SUFFIX)
    );
    
    let totalSize = 0;
    let validCaches = 0;
    let expiredCaches = 0;
    
    dataKeys.forEach(key => {
      try {
        const data = wx.getStorageSync(key);
        if (data) {
          totalSize += JSON.stringify(data).length;
          
          if (isCacheExpired(key)) {
            expiredCaches++;
          } else {
            validCaches++;
          }
        }
      } catch (e) {
        // 忽略单个缓存项的错误
      }
    });
    
    return {
      totalCaches: dataKeys.length,
      validCaches,
      expiredCaches,
      totalSizeKB: Math.round(totalSize / 1024),
      version: wx.getStorageSync(CACHE_CONFIG.VERSION_KEY) || 'unknown'
    };
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    return {
      totalCaches: 0,
      validCaches: 0,
      expiredCaches: 0,
      totalSizeKB: 0,
      version: 'unknown'
    };
  }
}

/**
 * 清理过期缓存
 */
function cleanExpiredCache() {
  try {
    const storageInfo = wx.getStorageInfoSync();
    const cacheKeys = storageInfo.keys.filter(key => 
      key.startsWith(CACHE_CONFIG.CACHE_PREFIX) && 
      !key.endsWith(CACHE_CONFIG.TIMESTAMP_SUFFIX)
    );
    
    let cleanedCount = 0;
    
    cacheKeys.forEach(key => {
      if (isCacheExpired(key)) {
        wx.removeStorageSync(key);
        wx.removeStorageSync(generateTimestampKey(key));
        cleanedCount++;
      }
    });
    
    console.log(`已清理 ${cleanedCount} 个过期缓存`);
    return cleanedCount;
  } catch (error) {
    console.error('清理过期缓存失败:', error);
    return 0;
  }
}

module.exports = {
  getCachedWords,
  setCachedWords,
  clearAllCache,
  getCacheStats,
  cleanExpiredCache,
  CACHE_CONFIG
};