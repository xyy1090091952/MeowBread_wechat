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
    errorList: [], // 错误状态的单词列表
    correctedList: [], // 已修正状态的单词列表
    correctedCount: 0, // 已修正单词数量
    showCorrectedModal: false, // 是否显示已修正弹窗
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

    // 按状态分类
    const errorList = processedMistakes.filter(mistake => mistake.status === WORD_STATUS.ERROR);
    const correctedList = processedMistakes.filter(mistake => mistake.status === WORD_STATUS.CORRECTED);

    this.setData({
      mistakeList: processedMistakes,
      errorList: errorList,
      correctedList: correctedList,
      mistakeCount: errorList.length, // 只计算错误状态的单词数
      correctedCount: correctedList.length
    });
  },

  /**
   * 显示已修正单词弹窗
   */
  showCorrectedModal: function() {
    this.setData({
      showCorrectedModal: true
    });
  },

  /**
   * 隐藏已修正单词弹窗
   */
  hideCorrectedModal: function() {
    this.setData({
      showCorrectedModal: false
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation: function() {
    // 阻止点击弹窗内容时关闭弹窗
  },

    /**
   * 开始复习，跳转到答题页面
   * 会将当前错词库中的所有单词传递给答题页
   */
  startReview: function () {
    // 只筛选出错误状态的单词进行复习，不包含已修正的单词
    const reviewWords = this.data.errorList;
    if (reviewWords.length === 0) {
      wx.showToast({
        title: '没有需要复习的错题，快去答题吧！',
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