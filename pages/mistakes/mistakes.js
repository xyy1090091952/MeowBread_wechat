/**
 * @file 错词库页面
 * @author MeowBread Team
 */

const { WORD_STATUS } = require('../../utils/constants.js');
const mistakeManager = require('../../utils/mistakeManager.js');
const { processWordStatus } = require('../../utils/statusManager.js'); // 引入状态处理函数

Page({
  data: {
    mistakeCount: 0,
    mistakeList: [],
    pageLoaded: false // 控制页面加载动画
  },

    /**
   * 生命周期函数--监听页面显示
   * 每次页面显示时都会调用，以确保数据实时更新
   */
  onShow: function () {
    this.loadMistakes();
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
   * 从本地缓存加载错题列表，并进行处理和渲染
   */
  loadMistakes: function () {
    const mistakes = mistakeManager.getMistakeList();

    const processedMistakes = mistakes.map(mistakeItem => {
      // 在错题库中，如果一个单词没有状态，或者状态无效，我们默认它就是个错误'error'
      if (!mistakeItem.status || ![WORD_STATUS.ERROR, WORD_STATUS.CORRECTED].includes(mistakeItem.status)) {
          mistakeItem.status = WORD_STATUS.ERROR;
      }
      // 使用通用的状态处理函数来附加 statusText 和 statusClass
      return processWordStatus(mistakeItem);
    });

    this.setData({
      mistakeList: processedMistakes,
      // 错词数应包含 'error' 和 'corrected' 状态的单词
      mistakeCount: processedMistakes.filter(mistake => 
        mistake.status === WORD_STATUS.ERROR || mistake.status === WORD_STATUS.CORRECTED
      ).length
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