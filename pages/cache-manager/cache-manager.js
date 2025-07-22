// pages/cache-manager/cache-manager.js
const wordManager = require('../../utils/wordManager.js');

Page({
  data: {
    cacheStats: {
      totalCaches: 0,
      totalSizeKB: 0
    },
    loading: false
  },

  onLoad() {
    this.loadCacheStats();
  },

  onShow() {
    this.loadCacheStats();
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