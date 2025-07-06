// pages/timeline/timeline.js
const filterManager = require('../../utils/filterManager.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentFilterDisplay: '', // 当前筛选显示文本
    pageLoaded: false, // 控制页面渐显动画
    timelineData: [], // 时间线数据
    isLoading: true // 加载状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('Timeline page loaded with options:', options);
    this.initializeTimelinePage();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('Timeline page ready');
    // 页面渲染完成后，启动渐显动画
    setTimeout(() => {
      this.setData({ pageLoaded: true });
    }, 100); // 延迟100ms开始动画，确保页面完全渲染
  },

  /**
   * 初始化时间线页面
   */
  initializeTimelinePage() {
    // 获取当前筛选配置
    const filter = filterManager.getFilter();
    const currentFilterDisplay = filter ? 
      `${filter.selectedDictionaryName} - ${filter.selectedLessonName}` : 
      '请先选择题库';
    
    this.setData({
      currentFilterDisplay,
      isLoading: false
    });

    // TODO: 加载时间线数据
    this.loadTimelineData();
  },

  /**
   * 加载时间线数据
   */
  loadTimelineData() {
    // TODO: 实现时间线数据加载逻辑
    console.log('Loading timeline data...');
    
    // 模拟数据加载
    setTimeout(() => {
      this.setData({
        timelineData: [
          // 这里将来会加载真实的时间线数据
        ],
        isLoading: false
      });
    }, 500);
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  }
}); 