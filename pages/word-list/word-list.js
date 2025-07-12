// pages/word-list/word-list.js
const { WORD_STATUS } = require('../../utils/constants.js');
const learnedManager = require('../../utils/learnedManager.js');
const mistakeManager = require('../../utils/mistakeManager.js'); // 引入错题管理器
const { processWordStatus } = require('../../utils/statusManager.js'); // 引入状态处理函数
const courseDataManager = require('../../utils/courseDataManager.js');


Page({
  data: {
    currentDictionary: null, // 当前选中的词典
    wordList: [], // 单词列表数据
    filteredWordList: null, // 筛选后的单词列表
    currentDictName: '', // 当前词典名称
    // 课程筛选相关数据
    showFilterModal: false, // 是否显示筛选弹窗
    modalAnimationClass: '', // 弹窗动画类名
    selectedCourse: 'all', // 选中的课程：all, primary_basic, primary_advanced 等
    selectedCourseName: '全部课程', // 显示的课程名称
    courseGroups: [], // 课程集合定义
    // 加载动画控制
    wordListLoaded: false // 控制单词列表页面渐显动画
  },

  onLoad(options) {
    // 获取传递过来的词典ID
    const dictionaryId = options.dictionaryId;
    if (dictionaryId) {
      this.initializeCourseGroups(dictionaryId); // 初始化课程集合
      this.loadWordList(dictionaryId);
    } else {
      wx.showToast({
        title: '词典参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 初始化课程集合定义
   * @param {string} dictionaryId - 词典ID
   */
  initializeCourseGroups(dictionaryId) {
    let courseGroups = [];
    
    try {
      // 使用课程数据管理器获取分册信息
      const volumes = courseDataManager.getTextbookVolumes(dictionaryId);
      
      if (volumes && volumes.length > 0) {
        courseGroups = volumes.map(volume => ({
          id: volume.volumeKey,
          name: volume.volumeName,
          lessons: volume.courseRange.length === 2 ? 
            this.generateLessonRange(volume.courseRange[0], volume.courseRange[1]) :
            volume.courses.map(course => course.courseNumber)
        }));
      } else {
        // 如果没有找到分册信息，使用默认的课程组织
        console.warn(`No volume info found for textbook: ${dictionaryId}, using fallback`);
        courseGroups = this.getFallbackCourseGroups(dictionaryId);
      }
    } catch (error) {
      console.error('Error loading course groups:', error);
      courseGroups = this.getFallbackCourseGroups(dictionaryId);
    }
    
    this.setData({
      courseGroups: courseGroups
    });
  },

  /**
   * 生成课程范围数组
   * @param {number} start - 开始课程号
   * @param {number} end - 结束课程号
   * @returns {Array} 课程号数组
   */
  generateLessonRange(start, end) {
    const range = [];
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  },

  /**
   * 获取回退的课程分组（当无法从课程信息文件获取时）
   * @param {string} dictionaryId - 词典ID
   * @returns {Array} 课程分组
   */
  getFallbackCourseGroups(dictionaryId) {
    // 为不同词典提供回退的课程分组
    switch (dictionaryId) {
      case 'liangs_class':
        return [
          {
            id: 'upper',
            name: '初级上',
            lessons: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
          },
          {
            id: 'lower', 
            name: '初级下',
            lessons: [17, 18, 19, 20, 21, 22, 23, 24, 25]
          }
        ];
      case 'everyones_japanese':
        return [
          {
            id: 'volume1',
            name: '第一册',
            lessons: [31, 32, 33, 34, 35, 36, 37]
          },
          {
            id: 'volume2',
            name: '第二册', 
            lessons: [38, 44, 45]
          }
        ];
      case 'duolingguo':
        return [
          {
            id: 'complete',
            name: '完整版',
            lessons: [1, 2, 3, 5]
          }
        ];
      default:
        return [];
    }
  },

  /**
   * 从文件名推断课程号
   * @param {string} filePath - 文件路径，如 'liangs_class/lesson5.js'
   * @returns {number} 课程号
   */
  extractLessonNumber(filePath) {
    const match = filePath.match(/lesson(\d+)\.js$/);
    return match ? parseInt(match[1], 10) : 0;
  },

  /**
   * 加载单词列表
   * @param {string} dictionaryId - 词典ID
   */
  loadWordList(dictionaryId) {
    const db = require('../../database/dictionaries.js').dictionaries;
    const dictionary = db.find(dict => dict.id === dictionaryId);
    
    if (!dictionary) {
      wx.showToast({
        title: '词典不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 加载该词典的所有单词
    let allWords = [];
    dictionary.lesson_files.forEach(filePath => {
      try {
        const lesson = require('../../database/' + filePath);
        const lessonNumber = this.extractLessonNumber(filePath); // 从文件名推断课程号
        
        // 统一处理函数，避免重复代码
        const processItems = (items) => {
          items.forEach(item => {
            // 确保 item.data 存在
            const wordData = item.data || item;
            if (!wordData || !wordData['假名']) return;

            // 1. 确定单词状态
            const mistake = mistakeManager.getMistake(wordData); // 全局错题库，不再需要 dictionaryId
            let statusKey;
            if (mistake) {
              statusKey = mistake.status;
            } else {
              const isLearned = learnedManager.isWordLearned(wordData, dictionaryId);
              statusKey = isLearned ? WORD_STATUS.MEMORIZED : WORD_STATUS.UNSEEN;
            }

            // 2. 构建基础单词对象
            const baseWordItem = {
              data: {
                '假名': wordData['假名'] || '',
                '汉字': wordData['汉字'] || '',
                '中文': wordData['中文'] || '',
                '词性': wordData['词性'] || '',
                '例句': wordData['例句'] || ''
              },
              lesson: lessonNumber,
              status: statusKey
            };

            // 3. 使用 statusManager 处理状态显示
            const processedWord = processWordStatus(baseWordItem);
            allWords.push(processedWord);
          });
        };

        if (Array.isArray(lesson)) {
          processItems(lesson);
        } else if (Array.isArray(lesson.words)) {
          processItems(lesson.words);
        }
      } catch (err) {
        console.warn('无法加载课时文件', filePath, err);
      }
    });

    // 更新页面数据，显示单词列表
    this.setData({
      currentDictionary: dictionary,
      currentDictName: dictionary.name,
      wordList: allWords,
      filteredWordList: null, // 重置筛选列表
      selectedCourse: 'all', // 重置课程选择
      selectedCourseName: '全部课程', // 重置课程名称显示
      wordListLoaded: false // 重置单词列表动画状态
    });

    // 启动单词列表页面的渐显动画
    setTimeout(() => {
      this.setData({ wordListLoaded: true });
    }, 100);
  },

  /**
   * 显示筛选弹窗
   */
  showFilterModal() {
    // 禁用页面滚动
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    });
    
    this.setData({
      showFilterModal: true,
      modalAnimationClass: ''
    });
    
    // 添加渐显动画
    setTimeout(() => {
      this.setData({
        modalAnimationClass: 'modal-fade-in'
      });
    }, 50);
  },

  /**
   * 隐藏筛选弹窗
   */
  hideFilterModal() {
    // 添加渐隐动画
    this.setData({
      modalAnimationClass: 'modal-fade-out'
    });
    
    // 动画完成后隐藏弹窗
    setTimeout(() => {
      this.setData({
        showFilterModal: false,
        modalAnimationClass: ''
      });
    }, 200); // 与CSS动画时间保持一致
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  /**
   * 选择课程
   */
  selectCourse(e) {
    const { course } = e.currentTarget.dataset;
    
    // 根据选择的课程设置显示名称
    let courseName = '全部课程';
    if (course !== 'all') {
      const courseGroup = this.data.courseGroups.find(group => group.id === course);
      if (courseGroup) {
        courseName = courseGroup.name;
      }
    }
    
    this.setData({
      selectedCourse: course,
      selectedCourseName: courseName,
      showFilterModal: false
    });
    
    // 执行课程筛选
    this.filterWordsByCourse(course);
  },

  /**
   * 根据课程筛选单词列表
   */
  filterWordsByCourse(courseId) {
    const { wordList } = this.data;
    let filteredList = null;

    if (courseId === 'all') {
      filteredList = null; // 显示全部
    } else {
      // 找到对应的课程集合
      const courseGroup = this.data.courseGroups.find(group => group.id === courseId);
      if (courseGroup) {
        filteredList = wordList.filter(word => courseGroup.lessons.includes(word.lesson));
      }
    }

    this.setData({
      filteredWordList: filteredList
    });
  },

  /**
   * 更新单个单词的状态并同步到视图
   * @param {object} wordData - 单词的核心数据 {汉字, 假名, ...}
   * @param {string} newStatusKey - 新的状态，如 'memorized', 'error'
   */
  updateWordState: function(wordData, newStatusKey) {
    const { wordList, filteredWordList } = this.data;

    // 查找并更新函数
    const updateList = (list, listName) => {
      if (!list) return;
      const index = list.findIndex(item => 
        item.data['汉字'] === wordData['汉字'] && item.data['假名'] === wordData['假名']
      );

      if (index > -1) {
        // 1. 构建基础单词对象
        const baseWordItem = { ...list[index], status: newStatusKey };
        // 2. 使用 statusManager 处理状态显示
        const processedWord = processWordStatus(baseWordItem);
        // 3. 更新视图
        this.setData({ [`${listName}[${index}]`]: processedWord });
      }
    };

    // 更新主列表和筛选列表
    updateList(wordList, 'wordList');
    updateList(filteredWordList, 'filteredWordList');
  },

  /**
   * 处理单词卡片长按事件
   */
  handleWordLongPress: function(e) {
    const word = e.detail.word;
    if (!word || !word.data) {
      console.error("handleWordLongPress: word or word.data is invalid.", e.detail);
      wx.showToast({ title: '无法获取单词信息', icon: 'none' });
      return;
    }

    const wordData = word.data;
    const that = this;
    const dictionaryId = that.data.currentDictionary.id;

    wx.showActionSheet({
      itemList: ['设为「已背」', '设为「未背」'],
      success: function(res) {
        const tapIndex = res.tapIndex;
        let newStatusKey = '';
        let toastTitle = '';

        if (tapIndex === 0) { // 设为「已背」
          learnedManager.markWordAsLearned(wordData, dictionaryId);
          mistakeManager.removeMistake(wordData); // 从错题库移除
          newStatusKey = WORD_STATUS.MEMORIZED;
          toastTitle = '已设为「已背」';
        } else if (tapIndex === 1) { // 设为「未背」
          learnedManager.unmarkWordAsLearned(wordData, dictionaryId);
          mistakeManager.removeMistake(wordData); // 从错题库移除
          newStatusKey = WORD_STATUS.UNSEEN;
          toastTitle = '已设为「未背」';
        }

        if (newStatusKey) {
          that.updateWordState(wordData, newStatusKey);
          wx.showToast({
            title: toastTitle,
            icon: 'success',
            duration: 1500
          });
        }
      },
      fail: function(res) {
        // 用户取消操作时，不打印错误信息
        if (res.errMsg !== "showActionSheet:fail cancel") {
          console.log(res.errMsg);
        }
      }
    });
  }
});