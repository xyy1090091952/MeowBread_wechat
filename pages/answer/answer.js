// pages/answer/answer.js
Page({
  data: {
    // 根据Figma设计稿，一级页面主要是选项，不直接展示题目信息
  },
  onLoad: function (options) {
    // 页面加载时可以进行一些初始化操作
    console.log('Page loaded with options:', options);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('Page ready');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('Page show');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log('Page hide');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('Page unload');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('User pulled down');
    // 可以在这里添加下拉刷新的逻辑
    // wx.stopPullDownRefresh(); // 处理完成后停止下拉刷新动画
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('Reached bottom');
    // 可以在这里添加上拉加载更多的逻辑
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    console.log('Share app message');
    return {
      title: 'MeowBread - 一起学日语吧！',
      path: '/pages/answer/answer', // 分享路径
      imageUrl: '' // 可以自定义分享图片的路径
    };
  },

  /**
   * 跳转到题库筛选页面
   */
  navigateToFilter() {
    console.log('Navigate to Filter');
    // 跳转到筛选页面时，可以传递一个默认的答题模式，例如 'quick'
    // filter.js 的 onLoad 会接收这个 mode
    wx.navigateTo({ url: '/pages/filter/filter?mode=quick' });
  },

  /**
   * 开始快速答题
   */
  startQuickQuiz() {
    console.log('Start Quick Quiz - All Dictionaries, All Lessons');
    // 快速答题默认加载所有词典的所有课程
    const lessonFile = 'ALL_DICTIONARIES_ALL_LESSONS';
    const dictionaryId = 'all';
    const basePath = ''; // 'all' 模式不需要 basePath
    wx.navigateTo({
      url: `/pages/quiz/quiz?mode=quick&lessonFile=${encodeURIComponent(lessonFile)}&dictionaryId=${encodeURIComponent(dictionaryId)}&basePath=${encodeURIComponent(basePath)}`
    });
  },

  /**
   * 开始无尽模式
   */
  startEndlessQuiz() {
    console.log('Start Endless Quiz');
    wx.navigateTo({ url: '/pages/quiz/quiz?mode=endless' });
  }
})
