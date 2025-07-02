Page({
  data: {
    currentDictionary: null, // 当前选中的词典
    wordList: [], // 单词列表数据
    filteredWordList: null, // 筛选后的单词列表
    currentDictName: '', // 当前词典名称
    // 筛选相关数据
    showFilterModal: false, // 是否显示筛选弹窗
    filterType: 'all', // 筛选类型：all, kana, kanji, example
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
        if (Array.isArray(lesson)) {
          // 处理每个单词，添加课程信息，并将中文字段名转换为英文字段名
          lesson.forEach(item => {
            if (item.data) {
              allWords.push({
                kana: item.data['假名'] || '',        // 假名
                kanji: item.data['汉字'] || '',       // 汉字
                meaning: item.data['中文'] || '',     // 中文意思
                type: item.data['词性'] || '',        // 词性
                example: item.data['例句'] || '',     // 例句
                lesson: item.lesson || 0             // 课程号
              });
            }
          });
        } else if (Array.isArray(lesson.words)) {
          // 如果是words数组格式，也进行字段转换
          lesson.words.forEach(word => {
            allWords.push({
              kana: word['假名'] || '',
              kanji: word['汉字'] || '',
              meaning: word['中文'] || '',
              type: word['词性'] || '',
              example: word['例句'] || '',
              lesson: word.lesson || 0
            });
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
      filterType: 'all', // 重置筛选类型
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
    this.setData({
      showFilterModal: true
    });
  },

  /**
   * 隐藏筛选弹窗
   */
  hideFilterModal() {
    this.setData({
      showFilterModal: false
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  /**
   * 选择筛选类型
   */
  selectFilter(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      filterType: type,
      showFilterModal: false
    });
    
    // 执行筛选
    this.filterWordList(type);
  },

  /**
   * 筛选单词列表
   */
  filterWordList(type) {
    const { wordList } = this.data;
    let filteredList = null;

    switch (type) {
      case 'all':
        filteredList = null; // 显示全部
        break;
      case 'kana':
        filteredList = wordList.filter(word => word.kana && !word.kanji);
        break;
      case 'kanji':
        filteredList = wordList.filter(word => word.kanji);
        break;
      case 'example':
        filteredList = wordList.filter(word => word.example);
        break;
      default:
        filteredList = null;
    }

    this.setData({
      filteredWordList: filteredList
    });
  }
}); 