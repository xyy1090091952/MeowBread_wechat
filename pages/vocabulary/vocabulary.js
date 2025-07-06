// pages/vocabulary/vocabulary.js
const learnedManager = require('../../utils/learnedManager.js');

Page({
  data: {
    bannerText: '切换课程,Meow Bread也会记录你的单词进度',
    categories: [], // [{id,title,dicts:[{id,name,wordCount,progress}] }]
    // 加载动画控制
    pageLoaded: false // 控制词典选择页面渐显动画
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

      // 使用学习进度管理器获取准确的学习进度
      const learningProgress = learnedManager.getLearningProgress(dict.id);
      const progress = learningProgress.progress;
      
      // 如果学习进度管理器返回的总数与计算的不同，使用计算的数量（更准确）
      const finalWordCount = learningProgress.totalCount || wordCount;

      return { ...dict, wordCount: finalWordCount, progress, cover: coverMap[dict.id] || '' };
    });

    // 获取用户选择的课本ID，用于优先排序
    // 从本地存储中读取用户之前选择的课本，如果没有选择则为空
    const selectedDictionaryId = wx.getStorageSync('selectedDictionary');
    
    // 自定义排序函数：用户选择的课本排在前面
    // 这个函数会让用户选择的课本在列表中显示在最前面，提供更好的用户体验
    const sortDictsBySelection = (dictsArray) => {
      return dictsArray.sort((a, b) => {
        // 如果a是用户选择的课本，则a排在前面（返回-1）
        if (a.id === selectedDictionaryId) return -1;
        // 如果b是用户选择的课本，则b排在前面（返回1）
        if (b.id === selectedDictionaryId) return 1;
        // 如果都不是用户选择的课本，保持原有顺序（返回0）
        return 0;
      });
    };

    // 简单分类：教材放 textbook, 其他放 software
    // 这里将词典数据 `dicts` 分成不同的类别 `categories` 以便在界面上展示
    // 这是一个常见的数据处理方法，用于将原始数据根据特定规则进行分组
    const categories = [
      {
        id: 'textbook', // 分类ID
        title: '课本Textbook', // 分类标题
        // 使用 Array.prototype.filter 方法筛选出所有 id 不等于 'duolingguo' 的词典
        // 这些词典将被归类到"课本"这个类别下
        // 同时应用自定义排序，让用户选择的课本排在前面
        dicts: sortDictsBySelection(dicts.filter(d => d.id !== 'duolingguo'))
      },
      {
        id: 'software',
        title: '其他Other',
        // 这里同样使用 filter 方法，筛选出 id 等于 'duolingguo' 的词典
        // 将 'duolingguo' 这个词典单独归类到"其他"类别下
        // 虽然这个分类只有一个词典，但为了保持代码一致性，也应用排序函数
        dicts: sortDictsBySelection(dicts.filter(d => d.id === 'duolingguo'))
      }
    ];

    this.setData({ categories });
  },

  /** 跳转到单词列表页面 */
  openDictionary(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) {
      return; // 无效点击
    }
    
    // 跳转到独立的单词列表页面
    wx.navigateTo({
      url: `/pages/word-list/word-list?dictionaryId=${id}`
    });
  },



  /** 页面展示时更新底部导航选中状态并重新加载进度数据 */
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
    
    // 重新加载数据以更新学习进度（用户可能刚完成答题）
    this.prepareData();
  }
});
