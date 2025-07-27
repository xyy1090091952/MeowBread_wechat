/**
 * @file 统计数据管理器 - 管理用户答题统计数据
 * @description 负责保存、获取和计算用户的答题统计信息
 */

const statisticsManager = {
  
  /**
   * 保存一次答题记录
   * @param {Object} quizResult - 答题结果
   * @param {number} quizResult.score - 得分
   * @param {number} quizResult.totalQuestions - 总题数
   * @param {number} quizResult.timeSpent - 用时(秒)
   * @param {number} quizResult.accuracy - 准确率(0-1)
   * @param {string} quizResult.mode - 答题模式 ('quick', 'course', 'mistakes')
   */
  saveQuizResult(quizResult) {
    try {
      // 获取现有的统计数据
      let allStats = wx.getStorageSync('userQuizStatistics') || [];
      
      // 添加新的答题记录
      const newRecord = {
        ...quizResult,
        timestamp: Date.now(), // 添加时间戳
        date: new Date().toLocaleDateString() // 添加日期
      };
      
      allStats.push(newRecord);
      
      // 保存到本地存储
      wx.setStorageSync('userQuizStatistics', allStats);
      
      // 如果是标准模式(quick)，增加完成次数
      if (quizResult.mode === 'quick') {
        this.incrementStandardModeCount();
      }
      
      console.log('答题统计数据已保存:', newRecord);
    } catch (error) {
      console.error('保存答题统计数据失败:', error);
    }
  },

  /**
   * 增加标准模式完成次数
   */
  incrementStandardModeCount() {
    try {
      let count = wx.getStorageSync('standardModeCount') || 0;
      count++;
      wx.setStorageSync('standardModeCount', count);
      console.log('标准模式完成次数已更新:', count);
    } catch (error) {
      console.error('更新标准模式完成次数失败:', error);
    }
  },

  /**
   * 获取标准模式完成次数
   * @returns {number} 标准模式完成次数
   */
  getStandardModeCount() {
    try {
      return wx.getStorageSync('standardModeCount') || 0;
    } catch (error) {
      console.error('获取标准模式完成次数失败:', error);
      return 0;
    }
  },


  
  /**
   * 获取用户的总体统计数据
   * @returns {Object} 统计数据对象
   */
  getOverallStatistics() {
    try {
      const allStats = wx.getStorageSync('userQuizStatistics') || [];
      
      if (allStats.length === 0) {
        return {
          totalQuestions: 0,
          correctAnswers: 0,
          averageAccuracy: 0,
          totalQuizzes: 0,
          totalTimeSpent: 0,
          averageTimePerQuestion: 0
        };
      }
      
      // 计算总体统计
      let totalQuestions = 0;
      let totalCorrectAnswers = 0;
      let totalTimeSpent = 0;
      let totalQuizzes = allStats.length;
      
      allStats.forEach(record => {
        totalQuestions += record.totalQuestions || 0;
        totalCorrectAnswers += record.score || 0;
        totalTimeSpent += record.timeSpent || 0;
      });
      
      const averageAccuracy = totalQuestions > 0 
        ? Math.round((totalCorrectAnswers / totalQuestions) * 100) 
        : 0;
        
      const averageTimePerQuestion = totalQuestions > 0
        ? Math.round(totalTimeSpent / totalQuestions)
        : 0;
      
      return {
        totalQuestions,
        correctAnswers: totalCorrectAnswers,
        averageAccuracy,
        totalQuizzes,
        totalTimeSpent,
        averageTimePerQuestion
      };
      
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        averageAccuracy: 0,
        totalQuizzes: 0,
        totalTimeSpent: 0,
        averageTimePerQuestion: 0
      };
    }
  },
  
  /**
   * 获取最近的答题记录
   * @param {number} limit - 获取记录数量，默认10条
   * @returns {Array} 最近的答题记录数组
   */
  getRecentQuizzes(limit = 10) {
    try {
      const allStats = wx.getStorageSync('userQuizStatistics') || [];
      return allStats
        .sort((a, b) => b.timestamp - a.timestamp) // 按时间倒序
        .slice(0, limit);
    } catch (error) {
      console.error('获取最近答题记录失败:', error);
      return [];
    }
  },
  
  /**
   * 清除所有统计数据
   */
  clearAllStatistics() {
    try {
      wx.removeStorageSync('userQuizStatistics');
      wx.removeStorageSync('standardModeCount'); // 清除标准模式完成次数
  
      console.log('所有统计数据已清除');
    } catch (error) {
      console.error('清除统计数据失败:', error);
    }
  },
  
  /**
   * 获取今日统计数据
   * @returns {Object} 今日统计数据
   */
  getTodayStatistics() {
    try {
      const allStats = wx.getStorageSync('userQuizStatistics') || [];
      const today = new Date().toLocaleDateString();
      
      const todayStats = allStats.filter(record => record.date === today);
      
      if (todayStats.length === 0) {
        return {
          totalQuestions: 0,
          correctAnswers: 0,
          averageAccuracy: 0,
          quizCount: 0
        };
      }
      
      let totalQuestions = 0;
      let totalCorrectAnswers = 0;
      
      todayStats.forEach(record => {
        totalQuestions += record.totalQuestions || 0;
        totalCorrectAnswers += record.score || 0;
      });
      
      const averageAccuracy = totalQuestions > 0 
        ? Math.round((totalCorrectAnswers / totalQuestions) * 100) 
        : 0;
      
      return {
        totalQuestions,
        correctAnswers: totalCorrectAnswers,
        averageAccuracy,
        quizCount: todayStats.length
      };
      
    } catch (error) {
      console.error('获取今日统计数据失败:', error);
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        averageAccuracy: 0,
        quizCount: 0
      };
    }
  }
};

module.exports = statisticsManager;