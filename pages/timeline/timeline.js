// pages/timeline/timeline.js - 课程模式页面
const filterManager = require('../../utils/filterManager.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentFilterDisplay: '', // 当前筛选显示文本
    pageLoaded: false, // 控制页面渐显动画
    courseData: [], // 课程数据
    isLoading: true // 加载状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('Course mode page loaded with options:', options);
    this.initializeCoursePage();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('Course mode page ready');
    // 页面渲染完成后，启动渐显动画
    setTimeout(() => {
      this.setData({ pageLoaded: true });
    }, 100); // 延迟100ms开始动画，确保页面完全渲染
  },

  /**
   * 初始化课程模式页面
   */
  initializeCoursePage() {
    // 获取当前筛选配置
    const filter = filterManager.getFilter();
    const currentFilterDisplay = filter ? 
      `${filter.selectedDictionaryName} - ${filter.selectedLessonName}` : 
      '请先选择题库';
    
    this.setData({
      currentFilterDisplay,
      isLoading: false
    });

    // TODO: 加载课程数据
    this.loadCourseData();
  },

  /**
   * 加载课程数据
   */
  loadCourseData() {
    // TODO: 实现课程数据加载逻辑
    console.log('Loading course data...');
    
    // 模拟数据加载
    setTimeout(() => {
      this.setData({
        courseData: [
          // 这里将来会加载真实的课程数据
          // 包含课程号、课程名、已学单词数、总单词数等信息
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