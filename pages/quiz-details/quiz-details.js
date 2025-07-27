// 引入统计管理器
const statisticsManager = require('../../utils/statisticsManager');
const userTitleManager = require('../../utils/userTitleManager.js');

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

    },
    formattedTimeSpent: '00:00:00', // 格式化的总练习时长 (时:分:秒)
    ratingInfo: {
      grade: 0 // 已背单词数量
    }
  },

  onLoad: function (options) {
    console.log('Quiz Details 页面加载');
    
    // 获取统计数据
    const overallStats = statisticsManager.getOverallStatistics();
    
    // 扩展统计数据，添加更多有用信息
    const extendedStats = {
      ...overallStats,
      // 计算平均每次答题数量
      averageQuestionsPerQuiz: overallStats.totalQuizzes > 0 
        ? Math.round(overallStats.totalQuestions / overallStats.totalQuizzes) 
        : 0,
      // 计算错误答案数量
      incorrectAnswers: overallStats.totalQuestions - overallStats.correctAnswers,
      // 计算错误率
      errorRate: overallStats.totalQuestions > 0 
        ? Math.round(((overallStats.totalQuestions - overallStats.correctAnswers) / overallStats.totalQuestions) * 100)
        : 0,
      // 获取真实的标准模式完成次数和无尽模式最长答题数
      standardModeCount: statisticsManager.getStandardModeCount(),
      
    };
    
    // 格式化练习时长
    const formattedTime = this.formatTimeSpent(overallStats.totalTimeSpent);
    
    // 获取用户等级称号信息（基于已背单词数量）
    const userTitleInfo = userTitleManager.getCurrentUserTitleInfo();
    
    // 更新数据
    this.setData({
      statistics: extendedStats,
      formattedTimeSpent: formattedTime,
      ratingInfo: {
        grade: userTitleInfo.learnedCount // 显示已背单词数量
      }
    });
    
    console.log('加载的统计数据:', extendedStats);
    console.log('用户等级称号信息:', userTitleInfo);
    
    // 触发加载动画
    this.triggerLoadAnimation();
  },

  onShow: function () {
    // 每次显示页面时重新加载数据
    this.onLoad();
    
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
   * 格式化时间显示为 时:分:秒 格式
   * @param {number} seconds - 总秒数
   * @returns {string} 格式化的时间字符串 (HH:MM:SS)
   */
  formatTimeSpent(seconds) {
    // 确保 seconds 是数字，如果为空或无效则设为 0
    const totalSeconds = parseInt(seconds) || 0;
    
    // 计算小时、分钟、秒
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    // 格式化为两位数字符串（补零）
    const formatNumber = (num) => num.toString().padStart(2, '0');
    
    // 返回 HH:MM:SS 格式
    return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(remainingSeconds)}`;
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
      // 清除统计数据（包括标准模式完成次数和无尽模式最长答题数）
      statisticsManager.clearAllStatistics();
      
      // 重新加载数据
      this.onLoad();
      
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