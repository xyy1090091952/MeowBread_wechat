/**
 * @file 错词库页面
 * @author MeowBread Team
 */

const { WORD_STATUS } = require('../../utils/constants.js');

Page({
  data: {
    mistakeCount: 0,
    mistakeList: []
  },

    /**
   * 生命周期函数--监听页面显示
   * 每次页面显示时都会调用，以确保数据实时更新
   */
  onShow: function () {
    this.loadMistakes();
  },

    /**
   * 从本地缓存加载错题列表，并进行处理和渲染
   */
  loadMistakes: function () {
    const mistakes = wx.getStorageSync('mistakeList') || [];
        const statusMap = {
      [WORD_STATUS.UNSEEN]: { text: '未背', class: 'status-unseen' },
      [WORD_STATUS.ERROR]: { text: '错误', class: 'status-error' },
      [WORD_STATUS.CORRECTED]: { text: '修正', class: 'status-corrected' },
      [WORD_STATUS.MEMORIZED]: { text: '已背', class: 'status-memorized' }
    };

        const processedMistakes = mistakes.map(mistakeItem => {
      // 如果单词没有状态或状态无效，则默认为 'error'
                  const statusKey = mistakeItem.status && statusMap[mistakeItem.status] ? mistakeItem.status : WORD_STATUS.ERROR;
            const status = statusMap[statusKey];
            mistakeItem.status = statusKey; // 确保每个item都有一个有效的状态
            mistakeItem.statusText = status.text;
            mistakeItem.statusClass = status.class;

            return mistakeItem;
    });

    this.setData({
      mistakeList: processedMistakes,
      // 错词数应包含 'error' 和 'corrected' 状态的单词
                  mistakeCount: processedMistakes.filter(mistake => mistake.status === WORD_STATUS.ERROR || mistake.status === WORD_STATUS.CORRECTED).length
    });
  },

    /**
   * 开始复习，跳转到答题页面
   * 会将当前错词库中的所有单词传递给答题页
   */
  startReview: function () {
    // 筛选出错词库中所有需要复习的单词
    const reviewWords = this.data.mistakeList;
    if (reviewWords.length === 0) {
      wx.showToast({
        title: '错词库是空的，快去答题吧！',
        icon: 'none'
      });
      return;
    }
    // 从每个条目中提取原始单词数据
    const wordsToReview = reviewWords.map(item => item.data);
    // 跳转到答题页面，并将错词列表作为参数传递
    wx.navigateTo({
      url: '/pages/quiz/quiz?from=mistakes&words=' + JSON.stringify(wordsToReview)
    });
  }
});