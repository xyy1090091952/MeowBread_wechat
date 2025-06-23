Page({
  data: {
    mistakeCount: 0,
    mistakeList: []
  },

  onLoad: function (options) {
    this.loadMistakes();
  },

  loadMistakes: function () {
    const mistakes = wx.getStorageSync('mistakeList') || [];
    const statusMap = {
      unseen: { text: '未背', class: 'status-unseen' },
      error: { text: '错误', class: 'status-error' },
      corrected: { text: '修正', class: 'status-corrected' },
      memorized: { text: '已背', class: 'status-memorized' }
    };

    const processedMistakes = mistakes.map(item => {
      // 如果单词没有状态或状态无效，则默认为 'error'
      const status = item.status && statusMap[item.status] ? item.status : 'error';
      item.status = status; // 确保每个item都有一个有效的状态
      item.statusText = statusMap[status].text;
      item.statusClass = statusMap[status].class;

      return item;
    });

    this.setData({
      mistakeList: processedMistakes,
      // 错词数应包含 'error' 和 'corrected' 状态的单词
      mistakeCount: processedMistakes.filter(item => item.status === 'error' || item.status === 'corrected').length
    });
  },

  startReview: function () {
    const reviewWords = this.data.mistakeList.filter(item => item.status === 'error');
    if (reviewWords.length === 0) {
      wx.showToast({
        title: '没有需要复习的错词',
        icon: 'none'
      });
      return;
    }
    // Navigate to the quiz page with the words to review
    wx.navigateTo({
      url: '/pages/quiz/quiz?from=mistakes&words=' + JSON.stringify(reviewWords)
    });
  }
});