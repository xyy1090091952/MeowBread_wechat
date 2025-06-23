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
      const status = item.status && statusMap[item.status] ? item.status : 'unseen';
      item.statusText = statusMap[status].text;
      item.statusClass = statusMap[status].class;
      return item;
    });

    this.setData({
      mistakeList: processedMistakes,
      mistakeCount: mistakes.filter(item => item.status === 'error').length
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