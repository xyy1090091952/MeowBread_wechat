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
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('Course mode page show');
    
    // 调试：输出当前筛选条件
    const filter = filterManager.getFilter();
    console.log('=== Course Mode Debug ===');
    console.log('Current filter in course-mode onShow:', filter);
    
    if (filter) {
      console.log('Filter keys:', Object.keys(filter));
      console.log('selectedDictionaryKey:', filter.selectedDictionaryKey);
      console.log('selectedDictionaryName:', filter.selectedDictionaryName);
      console.log('dictionaryId:', filter.dictionaryId);
    }
    
    // 页面显示时重新加载数据，以防用户在filter页面更改了教材选择
    this.loadCourseData();
    
    // 更新显示的筛选信息
    const currentFilterDisplay = filter ? 
      `你当前的课本：${filter.selectedDictionaryName}` : 
      '请先选择题库';
    
    this.setData({
      currentFilterDisplay
    });
  },

  /**
   * 初始化课程模式页面
   */
  initializeCoursePage() {
    // 获取当前筛选配置
    const filter = filterManager.getFilter();
    console.log('=== Initialize Course Page ===');
    console.log('Filter in initializeCoursePage:', filter);
    
    const currentFilterDisplay = filter ? 
      `你当前的课本：${filter.selectedDictionaryName}` : 
      '请先选择题库';
    
    this.setData({
      currentFilterDisplay,
      isLoading: false
    });

    // 加载课程数据
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
      console.log('Filter in loadCourseData:', filter);
      
      let textbook = 'liangs_class'; // 默认教材
      
      // 如果有筛选条件，使用筛选的教材
      if (filter) {
        // 优先使用 selectedDictionaryKey，如果没有则使用 dictionaryId
        if (filter.selectedDictionaryKey) {
          textbook = filter.selectedDictionaryKey;
          console.log('Using textbook from filter.selectedDictionaryKey:', textbook);
        } else if (filter.dictionaryId) {
          textbook = filter.dictionaryId;
          console.log('Using textbook from filter.dictionaryId:', textbook);
        } else {
          console.log('No dictionary identifier found, using default:', textbook);
        }
      } else {
        console.log('No filter found, using default:', textbook);
      }
      
      // 如果选择的是"全部辞典"，则使用默认教材
      if (textbook === 'all') {
        textbook = 'liangs_class';
        console.log('Changed from "all" to default textbook:', textbook);
      }

      console.log('Final textbook to load:', textbook);

      // 根据教材加载课程数据
      const courseList = courseDataManager.getAllCourseDetails(textbook);
      
      if (!courseList || courseList.length === 0) {
        console.warn(`No courses found for textbook: ${textbook}, falling back to default`);
        this.loadDefaultCourseData();
        return;
      }
      
      // 为每个课程添加学习进度信息
      const courseDataWithProgress = courseList.map(course => {
        const learnedWords = learnedManager.getLearnedWordsForCourse(textbook, course.lessonFile);
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
      const learnedWords = learnedManager.getLearnedWordsForCourse('liangs_class', course.lessonFile);
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
   * 点击卡片学习按钮
   */
  onCardStudyTap(e) {
    const courseData = e.currentTarget.dataset.course;
    console.log('Card study tapped:', courseData);

    // 获取教材名称
    const textbookInfo = courseDataManager.getTextbookInfo(courseData.textbook);
    const textbookName = textbookInfo ? textbookInfo.name : courseData.textbook;

    // 设置筛选器为当前课程
    filterManager.saveFilter({
      selectedDictionaryKey: courseData.textbook,
      selectedDictionaryName: textbookName,
      selectedLessonKey: courseData.lessonFile,
      selectedLessonName: `第${courseData.courseNumber}课`,
      selectedLessonFiles: [`${courseData.textbook}_${courseData.lessonFile}`],
      dictionaryId: courseData.textbook,
      basePath: courseData.textbook,
      quizMode: 'course',
      selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill']
    });

    // 跳转到卡片学习页面
    wx.navigateTo({
      url: '/pages/card-study/card-study?mode=course'
    });
  },

  /**
   * 点击答题按钮
   */
  onQuizTap(e) {
    const courseData = e.currentTarget.dataset.course;
    console.log('Quiz tapped:', courseData);

    // 获取教材名称
    const textbookInfo = courseDataManager.getTextbookInfo(courseData.textbook);
    const textbookName = textbookInfo ? textbookInfo.name : courseData.textbook;

    // 在设置临时课程选择之前，先保存用户的原始选择
    const currentFilter = filterManager.getFilter();
    if (currentFilter && currentFilter.quizMode !== 'course') {
      // 只有当前筛选不是course模式时，才保存为原始选择
      wx.setStorageSync('originalUserFilter', currentFilter);
    }

    // 设置筛选器为当前课程（临时选择）
    filterManager.saveFilter({
      selectedDictionaryKey: courseData.textbook,
      selectedDictionaryName: textbookName,
      selectedLessonKey: courseData.lessonFile,
      selectedLessonName: `第${courseData.courseNumber}课`,
      selectedLessonFiles: [`${courseData.textbook}_${courseData.lessonFile}`],
      dictionaryId: courseData.textbook,
      basePath: courseData.textbook,
      quizMode: 'course', // 新增课程模式
      selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill']
    });

    // 直接跳转到quiz页面，进行课程专项练习
    wx.navigateTo({
      url: '/pages/quiz/quiz?mode=course'
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 测试方法：手动设置筛选条件
   */
  testSetFilter() {
    console.log('=== 测试设置筛选条件 ===');
    
    // 手动设置一个大家的日语的筛选条件
    const testFilter = {
      selectedDictionaryKey: 'everyones_japanese',
      selectedDictionaryName: '大家的日语',
      selectedLessonName: '全部课程',
      dictionaryId: 'everyones_japanese',
      selectedLessonFiles: ['DICTIONARY_everyones_japanese_ALL_LESSONS'],
      quizMode: 'quick',
      selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice']
    };
    
    filterManager.saveFilter(testFilter);
    console.log('测试筛选条件已保存:', testFilter);
    
    // 重新加载课程数据
    this.loadCourseData();
  }
});