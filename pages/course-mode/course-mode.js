// pages/course-mode/course-mode.js - 课程模式页面
const filterManager = require('../../utils/filterManager.js');
const courseDataManager = require('../../utils/courseDataManager.js');
const learnedManager = require('../../utils/learnedManager.js');

const dictionaries = require('../../database/dictionaries.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentFilterDisplay: '', // 当前筛选显示文本
    pageLoaded: false, // 控制页面渐显动画
    courseData: [], // 课程数据
    isLoading: true, // 加载状态
    isCourseSelectorVisible: false, // 控制课程范围选择弹窗的显示
    courseSelectorOptions: [], // 课程范围选择器的选项
    selectedCourseRange: { label: '全部课程', value: 'all' }, // 当前选择的课程范围
    filterTitleDisplay: '全部课程' // 筛选器标题
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

      // 更新课程选择器选项
      this.updateCourseSelectorOptions(textbook);

      // 根据教材和选定的课程范围加载课程数据
      const selectedRangeValue = this.data.selectedCourseRange.value;
      const courseList = courseDataManager.getCourseDetailsByVolume(textbook, selectedRangeValue);
      
      if (!courseList || courseList.length === 0) {
        console.warn(`No courses found for textbook: ${textbook} and range: ${selectedRangeValue}`);
        this.setData({ courseData: [], isLoading: false });
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
   * 更新课程选择器的选项
   */
  updateCourseSelectorOptions(textbookKey) {
    // 从总的字典数据中找到当前教材
    const dictionary = dictionaries.dictionaries.find(d => d.id === textbookKey);

    // 检查教材是否存在，以及是否包含分册信息
    if (!dictionary || !dictionary.volumes || dictionary.volumes.length === 0) {
      // 如果没有分册信息，则默认只提供“全部课程”选项
      this.setData({ 
        courseSelectorOptions: [{ label: '全部课程', value: 'all' }] 
      });
      return;
    }

    // 将分册信息格式化为选择器所需的数组格式
    const options = dictionary.volumes.map(volume => ({
      label: volume.name, // 选项显示名
      value: volume.id, // 选项唯一标识
      sublabel: volume.description // 选项的描述
    }));

    // 在选项列表的开头添加“全部课程”选项
    options.unshift({ label: '全部课程', value: 'all' });

    // 更新页面的课程选择器选项
    this.setData({ courseSelectorOptions: options });
  },

  /**
   * 显示课程范围选择弹窗
   */
  showCourseSelector() {
    this.setData({ isCourseSelectorVisible: true });
  },

  /**
   * 隐藏课程范围选择弹窗
   */
  hideCourseSelector() {
    this.setData({ isCourseSelectorVisible: false });
  },

  /**
   * 处理课程范围选择确认事件
   */
  onCourseSelectorConfirm(e) {
    const { value } = e.detail;
    const selectedOption = this.data.courseSelectorOptions.find(opt => opt.value === value);

    if (selectedOption) {
      this.setData({
        selectedCourseRange: selectedOption,
        isCourseSelectorVisible: false,
        filterTitleDisplay: selectedOption.label // 更新筛选器标题
      });

      // 重新加载课程数据
      this.loadCourseData();
    } else {
      this.setData({
        isCourseSelectorVisible: false
      });
    }
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

    // 在设置临时课程选择之前，先保存用户的原始选择
    const currentFilter = filterManager.getFilter();
    if (currentFilter && currentFilter.quizMode !== 'course') {
      // 只有当前筛选不是course模式时，才保存为原始选择
      wx.setStorageSync('originalUserFilter', currentFilter);
    }

    // 获取用户之前设置的题型选择，如果没有则使用默认值
    let userSelectedQuestionTypes = ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'];
    if (currentFilter && currentFilter.selectedQuestionTypes && currentFilter.selectedQuestionTypes.length > 0) {
      userSelectedQuestionTypes = currentFilter.selectedQuestionTypes;
      console.log('卡片学习使用用户之前设置的题型:', userSelectedQuestionTypes);
    } else {
      console.log('卡片学习使用默认题型:', userSelectedQuestionTypes);
    }

    // 设置筛选器为当前课程，保留用户的题型选择
    filterManager.saveFilter({
      selectedDictionaryKey: courseData.textbook,
      selectedDictionaryName: textbookName,
      selectedLessonKey: courseData.lessonFile,
      selectedLessonName: `第${courseData.courseNumber}课`,
      lessonFiles: [`${courseData.textbook}_${courseData.lessonFile}`],
      dictionaryId: courseData.textbook,
      basePath: courseData.textbook,
      quizMode: 'course',
      selectedQuestionTypes: userSelectedQuestionTypes // 使用用户选择的题型
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

    // 获取用户之前设置的题型选择，如果没有则使用默认值
    let userSelectedQuestionTypes = ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'];
    if (currentFilter && currentFilter.selectedQuestionTypes && currentFilter.selectedQuestionTypes.length > 0) {
      userSelectedQuestionTypes = currentFilter.selectedQuestionTypes;
      console.log('使用用户之前设置的题型:', userSelectedQuestionTypes);
    } else {
      console.log('使用默认题型:', userSelectedQuestionTypes);
    }

    // 设置筛选器为当前课程（临时选择），保留用户的题型选择
    filterManager.saveFilter({
      selectedDictionaryKey: courseData.textbook,
      selectedDictionaryName: textbookName,
      selectedLessonKey: courseData.lessonFile,
      selectedLessonName: `第${courseData.courseNumber}课`,
      selectedLessonFiles: [`${courseData.textbook}_${courseData.lessonFile}`],
      dictionaryId: courseData.textbook,
      basePath: courseData.textbook,
      quizMode: 'course', // 新增课程模式
      selectedQuestionTypes: userSelectedQuestionTypes // 使用用户选择的题型
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