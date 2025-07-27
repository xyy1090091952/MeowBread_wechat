// pages/cache-manager/cache-manager.js
const wordManager = require('../../utils/wordManager.js');
const imageManager = require('../../utils/imageManager.js');

Page({
  data: {
    wordCache: {
      count: 0,
      size: 0
    },
    imageCache: {
      count: 0,
      size: 0
    },
    totalCache: {
      count: 0,
      size: 0
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
    this.setData({ loading: true });
    try {
      // 获取单词缓存统计
      const wordStats = await wordManager.getCacheStats();
      // 获取图片缓存统计
      const imageStats = await imageManager.getCacheStats();

      // 计算总缓存
      const totalCount = (wordStats.totalCaches || 0) + (imageStats.count || 0);
      const totalSizeKB = ((wordStats.totalSizeKB || 0) + (imageStats.size || 0) / 1024).toFixed(2);

      this.setData({
        wordCache: {
          count: wordStats.totalCaches || 0,
          size: wordStats.totalSizeKB || 0
        },
        imageCache: {
          count: imageStats.count || 0,
          size: (imageStats.size / 1024).toFixed(2) || 0 // 将字节转换为KB并保留两位小数
        },
        totalCache: {
          count: totalCount,
          size: totalSizeKB
        }
      });
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      wx.showToast({
        title: '获取缓存信息失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 清理所有缓存
  async clearAllCache() {
    const result = await this.showConfirmDialog('确定要清理所有缓存吗？', '清理后需要重新下载单词库数据和图片');
    if (!result) return;

    this.setData({ loading: true });

    try {
      await wordManager.clearAllCache();
      await imageManager.clearAllCache();
      
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