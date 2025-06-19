// pages/quiz-result/quiz-result.js
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
  },

  onLoad: function (options) {
    const { score, totalQuestions, timeSpent, accuracy, resultLevel } = options;

    const resultInfo = {
      noob: {
        text: '菜就多练？',
        image: '/images/result/noob.png'
      },
      normal: {
        text: '无事发生~',
        image: '/images/result/normal.png'
      },
      perfect: {
        text: '太牛逼了！',
        image: '/images/result/perfect.png'
      }
    };

    const accuracyPercentage = (parseFloat(accuracy) * 100).toFixed(0);

    this.setData({
      score: parseInt(score, 10) || 0,
      totalQuestions: parseInt(totalQuestions, 10) || 0,
      timeSpent: parseInt(timeSpent, 10) || 0,
      accuracy: parseFloat(accuracy) || 0,
      accuracyPercentage: accuracyPercentage,
      resultLevel: resultLevel || 'normal',
      resultText: resultInfo[resultLevel]?.text || resultInfo.normal.text,
      resultImage: resultInfo[resultLevel]?.image || resultInfo.normal.image,
      formattedTime: this.formatTime(parseInt(timeSpent, 10) || 0),
    });

    this.triggerAnimations();
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
  },

  formatTime: function (seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  handleDone: function () {
    // 使用 reLaunch 跳转到答题首页，会关闭所有其他页面
    wx.reLaunch({
      url: '/pages/answer/answer'
    });
  }
})