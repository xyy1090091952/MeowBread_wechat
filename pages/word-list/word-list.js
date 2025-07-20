// pages/word-list/word-list.js
const { WORD_STATUS } = require('../../utils/constants.js');
const learnedManager = require('../../utils/learnedManager.js');
const mistakeManager = require('../../utils/mistakeManager.js'); // 引入错题管理器
const { processWordStatus } = require('../../utils/statusManager.js'); // 引入状态处理函数
const courseDataManager = require('../../utils/courseDataManager.js');
const dictionaries = require('../../database/dictionaries.js');
const wordListFilterManager = require('../../utils/wordListFilterManager.js'); // 引入筛选记录管理器

Page({
  data: {
    currentDictionary: null, // 当前选中的词典
    wordList: [], // 单词列表数据
    filteredWordList: null, // 筛选后的单词列表
    currentDictName: '', // 当前词典名称
    // 课程选择器相关数据
    isCourseSelectorVisible: false, // 控制课程范围选择弹窗的显示
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
   * 处理课程范围选择确认事件 - 适配新的course-selector-enhanced组件
   */
  onCourseSelectorConfirm(e) {
    const { value, volumeId, label, description } = e.detail;
    
    // 构建选择的课程范围对象
    const selectedCourseRange = {
      value: value,
      volumeId: volumeId,
      label: label,
      description: description
    };
    
    // 更新选中的课程范围显示
    this.setData({
      selectedCourseRange: selectedCourseRange,
      isCourseSelectorVisible: false
    });

    // 保存当前词典的筛选记录
    const dictionaryId = this.data.currentDictionary?.id;
    if (dictionaryId) {
      wordListFilterManager.saveWordListFilter(dictionaryId, {
        selectedCourseRange: selectedCourseRange
      });
      console.log(`已保存词典 ${dictionaryId} 的课程筛选记录:`, selectedCourseRange);
    }

    // 重新筛选单词列表
    this.filterWordsByCourseEnhanced(value, volumeId);
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
  async loadWordList(dictionaryId) {
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

    // 异步加载该词典的所有单词
    const wordManager = require('../../utils/wordManager.js');
    let allWords = [];

    // 使用 Promise.all 并发加载所有 lesson_files
    const wordsByLesson = await Promise.all(dictionary.lesson_files.map(async (filePath) => {
      try {
        // 移除从文件名推断课程号的旧逻辑
        // const lessonNumber = this.extractLessonNumber(filePath); 
        const words = await wordManager.getWordsByFilter({ lessonFiles: [filePath], dictionaryId });
        // 直接返回获取到的单词，假设它们已经包含了 lesson 属性
        return words; 
      } catch (err) {
        console.warn('无法加载课时文件', filePath, err);
        return [];
      }
    }));

    allWords = wordsByLesson.flat(); // 将所有课程的单词扁平化到一个数组中

    // 对所有单词进行状态处理
    allWords = allWords.map(wordItem => {
      // 确保 wordItem.data 存在
      const wordData = wordItem.data || wordItem;
      if (!wordData || !wordData['假名']) return null;

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
        lesson: wordItem.lesson, // 保留课程号
        status: statusKey
      };

      // 3. 使用 statusManager 处理状态显示
      return processWordStatus(baseWordItem);
    }).filter(Boolean); // 过滤掉 null 值

    // 尝试恢复该词典的筛选记录
    const savedFilter = wordListFilterManager.getWordListFilter(dictionaryId);
    let initialCourseRange = { label: '全部课程', value: 'all' };
    
    if (savedFilter && savedFilter.selectedCourseRange) {
      initialCourseRange = savedFilter.selectedCourseRange;
      console.log(`恢复词典 ${dictionaryId} 的筛选记录:`, initialCourseRange);
    }

    // 更新页面数据，显示单词列表
    this.setData({
      currentDictionary: dictionary,
      currentDictName: dictionary.name,
      wordList: allWords,
      filteredWordList: null, // 重置筛选列表
      selectedCourseRange: initialCourseRange, // 使用恢复的或默认的课程选择
      wordListLoaded: false // 重置单词列表动画状态
    });

    // 如果有保存的筛选记录，应用筛选
    if (savedFilter && savedFilter.selectedCourseRange && savedFilter.selectedCourseRange.value !== 'all') {
      await this.filterWordsByCourseEnhanced(
        savedFilter.selectedCourseRange.value, 
        savedFilter.selectedCourseRange.volumeId
      );
    }

    // 启动单词列表页面的渐显动画
    setTimeout(() => {
      this.setData({ wordListLoaded: true });
    }, 100);
  },

  /**
   * 根据课程筛选单词 - 新版本，支持course-selector-enhanced组件
   * @param {string|number} courseValue - 课程值，'all' 表示全部课程，数字表示具体课程号
   * @param {string} volumeId - 分册ID
   */
  filterWordsByCourseEnhanced(courseValue, volumeId) {
    const { wordList, currentDictionary } = this.data;
    
    if (courseValue === 'all') {
      // 显示当前分册的全部单词
      if (volumeId === 'all' || !currentDictionary.volumes || currentDictionary.volumes.length === 0) {
        // 如果是全部分册或没有分册信息，显示所有单词
        this.setData({
          filteredWordList: null
        });
      } else {
        // 显示指定分册的所有单词
        const selectedVolume = currentDictionary.volumes.find(v => v.id === volumeId);
        if (selectedVolume && selectedVolume.lessons) {
          const filteredWords = wordList.filter(word => {
            return selectedVolume.lessons.includes(word.lesson);
          });
          this.setData({
            filteredWordList: filteredWords
          });
        } else {
          this.setData({
            filteredWordList: null
          });
        }
      }
    } else {
      // 显示具体课程的单词
      const lessonNumber = Number(courseValue);
      const filteredWords = wordList.filter(word => {
        return word.lesson === lessonNumber;
      });
      this.setData({
        filteredWordList: filteredWords
      });
    }
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