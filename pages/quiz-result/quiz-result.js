// pages/quiz-result/quiz-result.js
const statisticsManager = require('../../utils/statisticsManager.js');
const imageManager = require('../../utils/imageManager.js');

Page({
  data: {
    score: 0,
    totalQuestions: 0,
    timeSpent: 0,
    accuracy: 0,
    resultLevel: 'normal', // 'noob', 'normal', 'perfect'
    resultText: '',
    resultImage: '',
    formattedTime: '00:00',
    from: '', // 新增：页面来源，例如 'course'
    fromMistakes: false, // 默认不是从错题库来
    bubbleText: '',
    bubbleColor: '',
    coinsEarned: 0, // 新增：本次获得的金币数
    mode: 'quick', // 新增：答题模式
  },

  onLoad: async function (options) {
    const { score, totalQuestions, timeSpent, accuracy, resultLevel, coinsEarned, from, mode } = options; // 新增：获取答题模式

    const resultInfo = {
      noob: {
        text: '菜逼 Noob',
        image: await imageManager.getImagePath('https://free.picui.cn/free/2025/07/20/687cec7e7d209.png')
      },
      normal: {
        text: '平平无奇 Normal',
        image: await imageManager.getImagePath('https://free.picui.cn/free/2025/07/20/687cec7e5578f.png')
      },
      perfect: {
        text: '完美 Perfect',
        image: await imageManager.getImagePath('https://free.picui.cn/free/2025/07/20/687cec7e5cf3a.png')
      }
    };

    const bubbleInfo = {
      noob: { text: '菜就多练？', color: '#CFFFF0' },
      normal: { text: '无事发生~', color: '#FFCFE6' },
      perfect: { text: '太牛逼了！', color: '#FFFF00' }
    };

    const accuracyPercentage = (parseFloat(accuracy) * 100).toFixed(0);

    this.setData({
      from: from, // 设置页面来源
      fromMistakes: options.fromMistakes === 'true',
      mode: mode || 'quick', // 设置答题模式，默认为标准模式
      score: parseInt(score, 10) || 0,
      totalQuestions: parseInt(totalQuestions, 10) || 0,
      timeSpent: parseInt(timeSpent, 10) || 0,
      accuracy: parseFloat(accuracy) || 0,
      accuracyPercentage: accuracyPercentage,
      resultLevel: resultLevel || 'normal',
      resultText: resultInfo[resultLevel]?.text || resultInfo.normal.text,
      resultImage: resultInfo[resultLevel]?.image || resultInfo.normal.image,
      formattedTime: this.formatTime(parseInt(timeSpent, 10) || 0),
      bubbleText: bubbleInfo[resultLevel]?.text,
      bubbleColor: bubbleInfo[resultLevel]?.color,
      coinsEarned: parseInt(coinsEarned, 10) || 0, // 新增：设置金币数量
    });

    // 保存答题统计数据到本地存储
    this.saveQuizStatistics();
    
    this.triggerAnimations();
  },

  // 保存答题统计数据
  saveQuizStatistics: function() {
    const quizResult = {
      score: this.data.score,
      totalQuestions: this.data.totalQuestions,
      timeSpent: this.data.timeSpent,
      accuracy: this.data.accuracy,
      mode: this.data.mode // 添加答题模式信息
    };
    
    // 使用统计管理器保存数据
    statisticsManager.saveQuizResult(quizResult);
    console.log('答题结果已保存到统计数据:', quizResult);
  },

  triggerAnimations: function () {
    const animationInterval = 200; // 每个动画之间的间隔时间（毫秒）

    // 依次为元素设置动画类
    setTimeout(() => {
      this.setData({ 'animationClass.resultCard': 'animate-fade-in-up' });
    }, animationInterval * 1);

    setTimeout(() => {
      this.setData({ 'animationClass.statItem1': 'animate-fade-in-up' });
    }, animationInterval * 2);

    setTimeout(() => {
      this.setData({ 'animationClass.statItem2': 'animate-fade-in-up' });
    }, animationInterval * 3);

    setTimeout(() => {
      this.setData({ 'animationClass.statItem3': 'animate-fade-in-up' });
    }, animationInterval * 4);

    setTimeout(() => {
      this.setData({ 'animationClass.doneButton': 'animate-fade-in-up' });
    }, animationInterval * 5);

    setTimeout(() => {
      this.setData({ 'animationClass.bubble': 'animate-float-up' });
    }, animationInterval * 6);
  },

  formatTime: function (seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  handleDone: function () {
    // 如果是从课程模式或者错题库来的，则返回上一页
    if (this.data.from === 'course' || this.data.fromMistakes) {
      wx.navigateBack();
    } else {
      // 否则，返回答题首页
      wx.reLaunch({
        url: '/pages/answer/answer'
      });
    }
  }
})