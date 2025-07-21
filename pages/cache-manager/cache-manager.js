// pages/cache-manager/cache-manager.js
const wordManager = require('../../utils/wordManager.js');

Page({
  data: {
    cacheStats: {
      totalCaches: 0,
      totalSizeKB: 0
    },
    textbookStats: [], // 按课本统计的缓存信息
    loading: false
  },

  onLoad() {
    this.loadCacheStats();
    this.loadTextbookStats();
  },

  onShow() {
    this.loadCacheStats();
    this.loadTextbookStats();
  },

  // 加载缓存统计信息
  async loadCacheStats() {
    try {
      const stats = await wordManager.getCacheStats();
      this.setData({
        cacheStats: {
          totalCaches: stats.totalCaches || 0,
          totalSizeKB: stats.totalSizeKB || 0  // 直接使用返回的totalSizeKB字段
        }
      });
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      wx.showToast({
        title: '获取缓存信息失败',
        icon: 'none'
      });
    }
  },

  // 加载按课本统计信息
  async loadTextbookStats() {
    try {
      // 获取所有缓存的课本信息
      const textbookStats = await this.getTextbookCacheStats();
      this.setData({
        textbookStats
      });
    } catch (error) {
      console.error('获取课本统计失败:', error);
    }
  },

  // 获取按课本分组的缓存统计
  async getTextbookCacheStats() {
    try {
      // 从本地存储获取所有缓存的课本数据
      const cacheKeys = wx.getStorageInfoSync().keys;
      const wordCacheKeys = cacheKeys.filter(key => key.startsWith('word_cache_'));
      
      const textbookMap = new Map();
      
      for (const key of wordCacheKeys) {
        try {
          const cacheData = wx.getStorageSync(key);
          if (cacheData && cacheData.textbook) {
            const textbookId = cacheData.textbook.id;
            const textbookName = cacheData.textbook.name || '未知课本';
            
            if (!textbookMap.has(textbookId)) {
              textbookMap.set(textbookId, {
                id: textbookId,
                name: textbookName,
                cacheCount: 0,
                totalSize: 0
              });
            }
            
            const textbook = textbookMap.get(textbookId);
            textbook.cacheCount++;
            textbook.totalSize += JSON.stringify(cacheData).length;
          }
        } catch (error) {
          console.warn('解析缓存数据失败:', key, error);
        }
      }
      
      // 转换为数组并添加格式化的大小
      return Array.from(textbookMap.values()).map(item => ({
        ...item,
        sizeKB: Math.round(item.totalSize / 1024)
      })).sort((a, b) => b.cacheCount - a.cacheCount); // 按缓存数量降序排列
      
    } catch (error) {
      console.error('获取课本缓存统计失败:', error);
      return [];
    }
  },

  // 清理所有缓存
  async clearAllCache() {
    const result = await this.showConfirmDialog('确定要清理所有缓存吗？', '清理后需要重新下载单词库数据');
    if (!result) return;

    this.setData({ loading: true });

    try {
      await wordManager.clearAllCache();
      
      wx.showToast({
        title: '缓存清理成功',
        icon: 'success'
      });

      // 重新加载统计信息
      await this.loadCacheStats();
      await this.loadTextbookStats();
      
    } catch (error) {
      console.error('清理缓存失败:', error);
      wx.showToast({
        title: '清理失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 显示确认对话框
  showConfirmDialog(title, content) {
    return new Promise((resolve) => {
      wx.showModal({
        title,
        content,
        confirmText: '确定',
        cancelText: '取消',
        success: (res) => {
          resolve(res.confirm);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  }
});