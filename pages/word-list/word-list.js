// pages/word-list/word-list.js
const { WORD_STATUS } = require('../../utils/constants.js');
const learnedManager = require('../../utils/learnedManager.js');
const mistakeManager = require('../../utils/mistakeManager.js'); // 引入错题管理器

// 状态映射（与mistakes页面保持一致）
const STATUS_MAP = {
  [WORD_STATUS.UNSEEN]: { text: '未背', class: 'status-unseen' },
  [WORD_STATUS.ERROR]: { text: '错误', class: 'status-error' },
  [WORD_STATUS.CORRECTED]: { text: '修正', class: 'status-corrected' },
  [WORD_STATUS.MEMORIZED]: { text: '已背', class: 'status-memorized' }
};

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
    
    // 根据不同词典定义不同的课程集合
    if (dictionaryId === 'liangs_class') {
      courseGroups = [
        {
          id: 'primary_basic',
          name: '初级上',
          lessons: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] // 第5-16课
        },
        {
          id: 'primary_advanced', 
          name: '初级下',
          lessons: [17, 18, 19, 20, 21, 22, 23, 24, 25] // 第17-25课
        }
      ];
    }
    // 其他词典可以在这里添加相应的课程集合定义
    
    this.setData({
      courseGroups: courseGroups
    });
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
        
        if (Array.isArray(lesson)) {
          // 处理每个单词，保持word-card组件期望的数据格式，并添加状态信息和课程号
          lesson.forEach(item => {
            if (item.data) {
              // --- 状态判断逻辑优化 ---
              // 1. 检查是否在错题库中
              const mistake = mistakeManager.getMistake(item.data, dictionaryId);
              let statusKey;

              if (mistake) {
                // 如果在错题库中，使用错题库中的状态
                statusKey = mistake.status;
              } else {
                // 2. 如果不在错题库中，检查是否已背
                const isLearned = learnedManager.isWordLearned(item.data, dictionaryId);
                statusKey = isLearned ? WORD_STATUS.MEMORIZED : WORD_STATUS.UNSEEN;
              }
              
              const status = STATUS_MAP[statusKey] || STATUS_MAP[WORD_STATUS.UNSEEN]; // 增加默认值以防万一
              
              const wordItem = {
                data: {
                  '假名': item.data['假名'] || '',     // 保持原字段名
                  '汉字': item.data['汉字'] || '',     // 保持原字段名
                  '中文': item.data['中文'] || '',     // 保持原字段名
                  '词性': item.data['词性'] || '',     // 保持原字段名
                  '例句': item.data['例句'] || ''      // 保持原字段名
                },
                lesson: lessonNumber,               // 课程号（从文件名推断）
                status: statusKey,                  // 状态值
                statusText: status.text,            // 状态文字
                statusClass: status.class           // 状态类名
              };
              
              allWords.push(wordItem);
            }
          });
        } else if (Array.isArray(lesson.words)) {
          // 如果是words数组格式，也保持word-card组件期望的数据格式
          lesson.words.forEach(word => {
            // 检查单词是否已背，设置正确的状态
            const wordData = {
              '假名': word['假名'] || '',
              '汉字': word['汉字'] || '',
              '中文': word['中文'] || '',
              '词性': word['词性'] || '',
              '例句': word['例句'] || ''
            };

            // --- 状态判断逻辑优化 ---
            // 1. 检查是否在错题库中
            const mistake = mistakeManager.getMistake(wordData, dictionaryId);
            let statusKey;

            if (mistake) {
              // 如果在错题库中，使用错题库中的状态
              statusKey = mistake.status;
            } else {
              // 2. 如果不在错题库中，检查是否已背
              const isLearned = learnedManager.isWordLearned(wordData, dictionaryId);
              statusKey = isLearned ? WORD_STATUS.MEMORIZED : WORD_STATUS.UNSEEN;
            }

            const status = STATUS_MAP[statusKey] || STATUS_MAP[WORD_STATUS.UNSEEN]; // 增加默认值以防万一
            
            const wordItem = {
              data: wordData,
              lesson: lessonNumber,               // 课程号（从文件名推断）
              status: statusKey,                  // 状态值
              statusText: status.text,            // 状态文字
              statusClass: status.class           // 状态类名
            };
            
            allWords.push(wordItem);
          });
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
  }
});