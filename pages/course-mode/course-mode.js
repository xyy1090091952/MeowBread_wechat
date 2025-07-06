// pages/course-mode/course-mode.js - 课程模式页面
const filterManager = require('../../utils/filterManager.js');
const courseDataManager = require('../../utils/courseDataManager.js');
const learnedManager = require('../../utils/learnedManager.js');

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
    console.log('Loading course data...');
    
    try {
      // 获取当前筛选的教材
      const filter = filterManager.getFilter();
      if (!filter || !filter.selectedDictionaryKey) {
        console.log('No filter selected, using default textbook');
        this.loadDefaultCourseData();
        return;
      }

      // 根据筛选的教材加载课程数据
      const textbook = filter.selectedDictionaryKey;
      const courseList = courseDataManager.getAllCourseDetails(textbook);
      
      // 为每个课程添加学习进度信息
      const courseDataWithProgress = courseList.map(course => {
        const learnedWords = learnedManager.getLearnedWords(textbook, course.courseNumber);
        const learnedCount = learnedWords.length;
        const totalWords = course.wordCount;
        const progress = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;
        const isCompleted = progress >= 100;

        return {
          courseNumber: course.courseNumber,
          courseTitle: course.courseTitle,
          description: course.description,
          learnedCount: learnedCount,
          totalWords: totalWords,
          progress: progress,
          isCompleted: isCompleted,
          textbook: textbook,
          lessonFile: course.lessonFile
        };
      });

      this.setData({
        courseData: courseDataWithProgress,
        isLoading: false
      });

    } catch (error) {
      console.error('Error loading course data:', error);
      this.loadDefaultCourseData();
    }
  },

  /**
   * 加载默认课程数据（梁老师的课程）
   */
  loadDefaultCourseData() {
    const courseList = courseDataManager.getAllCourseDetails('liangs_class');
    
    const courseDataWithProgress = courseList.map(course => {
      const learnedWords = learnedManager.getLearnedWords('liangs_class', course.courseNumber);
      const learnedCount = learnedWords.length;
      const totalWords = course.wordCount;
      const progress = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;
      const isCompleted = progress >= 100;

      return {
        courseNumber: course.courseNumber,
        courseTitle: course.courseTitle,
        description: course.description,
        learnedCount: learnedCount,
        totalWords: totalWords,
        progress: progress,
        isCompleted: isCompleted,
        textbook: 'liangs_class',
        lessonFile: course.lessonFile
      };
    });

    this.setData({
      courseData: courseDataWithProgress,
      isLoading: false
    });
  },

  /**
   * 点击课程项目，进入学习
   */
  onCourseItemTap(e) {
    const courseData = e.currentTarget.dataset.course;
    console.log('Course item tapped:', courseData);

    // 设置筛选器为当前课程
    filterManager.setFilter({
      selectedDictionaryKey: courseData.textbook,
      selectedDictionaryName: courseData.textbook === 'liangs_class' ? '梁老师的日语课' : courseData.textbook,
      selectedLessonKey: courseData.lessonFile,
      selectedLessonName: `第${courseData.courseNumber}课 ${courseData.courseTitle}`
    });

    // 跳转到答题页面
    wx.navigateTo({
      url: '/pages/answer/answer'
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  }
}); 