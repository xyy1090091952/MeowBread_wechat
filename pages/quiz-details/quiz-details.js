// 引入统计管理器
const statisticsManager = require('../../utils/statisticsManager');

Page({
  data: {
    pageLoaded: false, // 控制页面渐显动画
    statistics: {
      totalQuestions: 0,
      correctAnswers: 0,
      averageAccuracy: 0,
      totalQuizzes: 0,
      totalTimeSpent: 0,
      averageTimePerQuestion: 0,
      standardModeCount: 0, // 标准模式完成次数（暂时模拟数据）
      endlessModeRecord: 0   // 无尽模式最长答题数（暂时模拟数据）
    },
    formattedTimeSpent: '0分钟', // 格式化的总练习时长
    ratingInfo: {
      grade: 'C',
      description: '新手上路'
    }
  },

  onLoad: function (options) {
    // 加载统计数据
    this.loadStatistics();
    
    // 触发加载动画
    this.triggerLoadAnimation();
  },

  onShow: function () {
    // 每次显示页面时重新加载数据
    this.loadStatistics();
    
    // 每次显示页面时都触发动画
    this.triggerLoadAnimation();
  },

  // 触发加载动画
  triggerLoadAnimation: function() {
    // 重置动画状态
    this.setData({
      pageLoaded: false
    });
    
    // 延迟触发动画，确保页面渲染完成
    setTimeout(() => {
      this.setData({
        pageLoaded: true
      });
    }, 100);
  },

  /**
   * 加载统计数据
   */
  loadStatistics() {
    try {
      // 获取总体统计数据
      const overallStats = statisticsManager.getOverallStatistics();
      
      // 模拟扩展数据（未来需要在statisticsManager中实现）
      const extendedStats = {
        ...overallStats,
        standardModeCount: this.getStandardModeCount(),
        endlessModeRecord: this.getEndlessModeRecord()
      };
      
      // 格式化时间
      const formattedTime = this.formatTimeSpent(overallStats.totalTimeSpent);
      
      // 计算评级
      const ratingInfo = this.calculateRating(extendedStats);
      
      // 更新数据
      this.setData({
        statistics: extendedStats,
        formattedTimeSpent: formattedTime,
        ratingInfo: ratingInfo
      });
      
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  /**
   * 格式化时间显示
   * @param {number} seconds - 总秒数
   * @returns {string} 格式化的时间字符串
   */
  formatTimeSpent(seconds) {
    if (!seconds || seconds < 60) {
      return `${seconds || 0}秒`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return remainingSeconds > 0 
        ? `${minutes}分${remainingSeconds}秒`
        : `${minutes}分钟`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0
      ? `${hours}小时${remainingMinutes}分钟`
      : `${hours}小时`;
  },

  /**
   * 计算综合评级
   * @param {Object} stats - 统计数据
   * @returns {Object} 评级信息
   */
  calculateRating(stats) {
    // 评级算法：基于答题数量、准确率、练习次数的综合评估
    let score = 0;
    
    // 答题数量评分 (0-40分)
    const questionScore = Math.min(stats.totalQuestions / 50, 1) * 40;
    score += questionScore;
    
    // 准确率评分 (0-40分)
    const accuracyScore = (stats.averageAccuracy / 100) * 40;
    score += accuracyScore;
    
    // 练习次数评分 (0-20分)
    const quizScore = Math.min(stats.totalQuizzes / 20, 1) * 20;
    score += quizScore;
    
    // 根据分数确定等级
    let grade, description;
    
    if (score >= 90) {
      grade = 'SSS';
      description = '日语大师';
    } else if (score >= 80) {
      grade = 'SS';
      description = '单词达人';
    } else if (score >= 70) {
      grade = 'S';
      description = '优秀学习者';
    } else if (score >= 60) {
      grade = 'A';
      description = '勤奋练习者';
    } else if (score >= 50) {
      grade = 'B';
      description = '努力学习中';
    } else {
      grade = 'C';
      description = '新手上路';
    }
    
    return {
      grade,
      description
    };
  },

  /**
   * 获取标准模式完成次数（模拟数据，未来需要实现）
   * @returns {number}
   */
  getStandardModeCount() {
    // 临时模拟数据
    const mockData = wx.getStorageSync('standardModeCount') || 0;
    return mockData;
  },

  /**
   * 获取无尽模式最长答题数（模拟数据，未来需要实现）
   * @returns {number}
   */
  getEndlessModeRecord() {
    // 临时模拟数据
    const mockData = wx.getStorageSync('endlessModeRecord') || 0;
    return mockData;
  },

  /**
   * 重置数据按钮点击事件
   */
  onResetData() {
    wx.showModal({
      title: '重置数据',
      content: '确定要重置所有学习数据吗？此操作不可恢复。',
      confirmText: '确定重置',
      cancelText: '取消',
      confirmColor: '#FF4E91',
      success: (res) => {
        if (res.confirm) {
          this.resetAllData();
        }
      }
    });
  },

  /**
   * 执行重置所有数据
   */
  resetAllData() {
    try {
      // 清除统计数据
      statisticsManager.clearAllStatistics();
      
      // 清除模拟数据
      wx.removeStorageSync('standardModeCount');
      wx.removeStorageSync('endlessModeRecord');
      
      // 重新加载数据
      this.loadStatistics();
      
      // 显示成功提示
      wx.showToast({
        title: '数据已重置',
        icon: 'success',
        duration: 2000
      });
      
      console.log('所有学习数据已重置');
      
    } catch (error) {
      console.error('重置数据失败:', error);
      wx.showToast({
        title: '重置失败',
        icon: 'error',
        duration: 2000
      });
    }
  }
}) 