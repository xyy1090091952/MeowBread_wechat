Page({
  data: {
    mistakeCount: 0,
    mistakeList: []
  },

  onLoad: function (options) {
    this.loadMistakes();
  },

  loadMistakes: function () {
    const mistakes = wx.getStorageSync('mistakes') || [];
    this.setData({
      mistakeList: mistakes,
      mistakeCount: mistakes.filter(item => item.status === 'error').length
    });
  },

  toggleStatus: function (e) {
    const id = e.currentTarget.dataset.id;
    const mistakeList = this.data.mistakeList.map(item => {
      if (item.id === id) {
        item.status = item.status === 'corrected' ? 'error' : 'corrected';
      }
      return item;
    });

    this.setData({
      mistakeList: mistakeList,
      mistakeCount: mistakeList.filter(item => item.status === 'error').length
    });
    wx.setStorageSync('mistakes', mistakeList);
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