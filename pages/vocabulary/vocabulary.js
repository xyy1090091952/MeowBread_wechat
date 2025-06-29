// pages/vocabulary/vocabulary.js
Page({
  data: {
    bannerText: 'Meow Bread 会记录你每一次的学习进度',
    categories: [], // [{id,title,dicts:[{id,name,wordCount,progress}] }]
    // 单词列表相关数据
    showWordList: false, // 是否显示单词列表
    currentDictionary: null, // 当前选中的词典
    wordList: [], // 单词列表数据
    filteredWordList: null, // 筛选后的单词列表
    currentDictName: '', // 当前词典名称
    // 筛选相关数据
    showFilterModal: false, // 是否显示筛选弹窗
    filterType: 'all', // 筛选类型：all, kana, kanji, example
    // 加载动画控制
    pageLoaded: false, // 控制词典选择页面渐显动画
    wordListLoaded: false // 控制单词列表页面渐显动画
  },

  onLoad() {
    this.prepareData();
    // 页面加载完成后启动渐显动画
    setTimeout(() => {
      this.setData({ pageLoaded: true });
    }, 100);
  },

  /**
   * 组装词库数据及分类
   */
  prepareData() {
    const db = require('../../database/dictionaries.js').dictionaries;

    // 计算词汇总数，简单遍历 lesson 文件
    const dicts = db.map(dict => {
      const coverMap = {
        'everyones_japanese': '../../images/book/dajia.jpg',
        'liangs_class': '../../images/book/liang.jpg',
        'duolingguo': '../../images/book/duolingguo.jpg'
      };
      let wordCount = 0;
      dict.lesson_files.forEach(filePath => {
        try {
          // 动态引入课时文件 (注意路径需相对当前 js)
          const lesson = require('../../database/' + filePath);
          if (Array.isArray(lesson)) {
            wordCount += lesson.length;
          } else if (Array.isArray(lesson.words)) {
            wordCount += lesson.words.length;
          }
        } catch (err) {
          console.warn('无法加载课时文件', filePath);
        }
      });

      // 从本地存储读取已学习数量，计算进度百分比
      const learnedKey = `learned_${dict.id}`;
      const learnedCount = wx.getStorageSync(learnedKey) || 0;
      const progress = wordCount ? Math.floor((learnedCount / wordCount) * 100) : 0;

      return { ...dict, wordCount, progress, cover: coverMap[dict.id] || '' };
    });

    // 简单分类：教材放 textbook, 其他放 software
    // 这里将词典数据 `dicts` 分成不同的类别 `categories` 以便在界面上展示
    // 这是一个常见的数据处理方法，用于将原始数据根据特定规则进行分组
    const categories = [
      {
        id: 'textbook', // 分类ID
        title: '课本Textbook', // 分类标题
        // 使用 Array.prototype.filter 方法筛选出所有 id 不等于 'duolingguo' 的词典
        // 这些词典将被归类到"课本"这个类别下
        dicts: dicts.filter(d => d.id !== 'duolingguo')
      },
      {
        id: 'software',
        title: '其他Other',
        // 这里同样使用 filter 方法，筛选出 id 等于 'duolingguo' 的词典
        // 将 'duolingguo' 这个词典单独归类到"其他"类别下
        dicts: dicts.filter(d => d.id === 'duolingguo')
      }
    ];

    this.setData({ categories });
  },

  /** 跳转到详情或筛选页面 */
  openDictionary(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      return; // 无效点击
    }
    
    // 显示单词列表而不是跳转到其他页面
    this.showWordList(id);
  },

  /**
   * 显示单词列表
   * @param {string} dictionaryId - 词典ID
   */
  showWordList(dictionaryId) {
    const db = require('../../database/dictionaries.js').dictionaries;
    const dictionary = db.find(dict => dict.id === dictionaryId);
    
    if (!dictionary) {
      wx.showToast({
        title: '词典不存在',
        icon: 'error'
      });
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

    // 隐藏tabbar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        show: false
      });
    }

    // 更新页面数据，显示单词列表
    this.setData({
      showWordList: true,
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
   * 关闭单词列表，返回词典选择页面
   */
  closeWordList() {
    // 显示tabbar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        show: true
      });
    }

    this.setData({
      showWordList: false,
      currentDictionary: null,
      currentDictName: '',
      wordList: [],
      filteredWordList: null,
      showFilterModal: false,
      filterType: 'all',
      wordListLoaded: false // 重置单词列表动画状态
    });
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
  },

  /** 页面展示时更新底部导航选中状态 */
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const page = getCurrentPages().pop();
      const route = page.route;
      const tabList = this.getTabBar().data.tabList;
      const index = tabList.findIndex(item => item.pagePath === route);
      if (index !== -1) {
        this.getTabBar().updateSelected(index);
      }
    }
  }
});
