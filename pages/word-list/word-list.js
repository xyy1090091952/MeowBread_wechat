// pages/word-list/word-list.js
const { WORD_STATUS } = require('../../utils/constants.js');
const learnedManager = require('../../utils/learnedManager.js');
const mistakeManager = require('../../utils/mistakeManager.js'); // 引入错题管理器
const { processWordStatus } = require('../../utils/statusManager.js'); // 引入状态处理函数
const courseDataManager = require('../../utils/courseDataManager.js');
const dictionaries = require('../../database/dictionaries.js');

Page({
  data: {
    currentDictionary: null, // 当前选中的词典
    wordList: [], // 单词列表数据
    filteredWordList: null, // 筛选后的单词列表
    currentDictName: '', // 当前词典名称
    // 课程选择器相关数据 - 与course-mode页面保持一致
    isCourseSelectorVisible: false, // 控制课程范围选择弹窗的显示
    courseSelectorOptions: [], // 课程范围选择器的选项
    selectedCourseRange: { label: '全部课程', value: 'all' }, // 当前选择的课程范围
    // 加载动画控制
    wordListLoaded: false // 控制单词列表页面渐显动画
  },

  onLoad(options) {
    // 获取传递过来的词典ID
    const dictionaryId = options.dictionaryId;
    if (dictionaryId) {
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
   * 更新课程选择器的选项 - 与course-mode页面保持一致
   */
  updateCourseSelectorOptions(dictionaryId) {
    // 从总的字典数据中找到当前教材
    const dictionary = dictionaries.dictionaries.find(d => d.id === dictionaryId);

    // 检查教材是否存在，以及是否包含分册信息
    if (!dictionary || !dictionary.volumes || dictionary.volumes.length === 0) {
      // 如果没有分册信息，则默认只提供"全部课程"选项
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

    // 在选项列表的开头添加"全部课程"选项
    options.unshift({ label: '全部课程', value: 'all' });

    // 更新页面的课程选择器选项
    this.setData({ courseSelectorOptions: options });
  },

  /**
   * 显示课程范围选择弹窗 - 与course-mode页面保持一致
   */
  showCourseSelector() {
    this.setData({ isCourseSelectorVisible: true });
  },

  /**
   * 隐藏课程范围选择弹窗 - 与course-mode页面保持一致
   */
  hideCourseSelector() {
    this.setData({ isCourseSelectorVisible: false });
  },

  /**
   * 处理课程范围选择确认事件 - 与course-mode页面保持一致
   */
  onCourseSelectorConfirm(e) {
    const { value } = e.detail;
    const selectedOption = this.data.courseSelectorOptions.find(opt => opt.value === value);

    if (selectedOption) {
      this.setData({
        selectedCourseRange: selectedOption,
        isCourseSelectorVisible: false
      });

      // 重新筛选单词列表
      this.filterWordsByCourse(value);
    } else {
      this.setData({
        isCourseSelectorVisible: false
      });
    }
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
      selectedCourseRange: { label: '全部课程', value: 'all' }, // 重置课程选择
      wordListLoaded: false // 重置单词列表动画状态
    });

    // 初始化课程选择器选项
    this.updateCourseSelectorOptions(dictionaryId);

    // 启动单词列表页面的渐显动画
    setTimeout(() => {
      this.setData({ wordListLoaded: true });
    }, 100);
  },

  /**
   * 根据课程ID筛选单词 - 改进版本，支持新的课程选择器
   * @param {string} courseId - 课程ID，'all' 表示全部课程
   */
  filterWordsByCourse(courseId) {
    const { wordList, currentDictionary } = this.data;
    
    if (courseId === 'all') {
      // 显示全部单词
      this.setData({
        filteredWordList: null
      });
      return;
    }

    // 根据选中的课程范围筛选单词
    const dictionary = dictionaries.dictionaries.find(d => d.id === currentDictionary.id);
    if (!dictionary || !dictionary.volumes) {
      console.warn('无法找到课程范围信息');
      return;
    }

    const selectedVolume = dictionary.volumes.find(v => v.id === courseId);
    if (!selectedVolume) {
      console.warn('无法找到选中的课程范围');
      return;
    }

    // 获取该分册包含的课程号范围
    let lessonNumbers = [];
    if (selectedVolume.courseRange && selectedVolume.courseRange.length === 2) {
      // 如果有课程范围，生成范围内的所有课程号
      lessonNumbers = this.generateLessonRange(selectedVolume.courseRange[0], selectedVolume.courseRange[1]);
    } else if (selectedVolume.courses) {
      // 如果有具体的课程列表，使用课程号
      lessonNumbers = selectedVolume.courses.map(course => course.courseNumber);
    }

    // 筛选单词
    const filteredWords = wordList.filter(word => {
      return lessonNumbers.includes(word.lesson);
    });

    this.setData({
      filteredWordList: filteredWords
    });
  },

  /**
   * 更新单词状态
   * @param {Object} wordData - 单词数据
   * @param {string} newStatusKey - 新的状态键
   */
  updateWordState(wordData, newStatusKey) {
    const { wordList, filteredWordList } = this.data;
    
    const updateList = (list, listName) => {
      if (!list) return;
      
      const index = list.findIndex(item => 
        item.data && item.data['假名'] === wordData['假名'] && 
        item.data['汉字'] === wordData['汉字']
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