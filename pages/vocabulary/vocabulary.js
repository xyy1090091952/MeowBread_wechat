// pages/vocabulary/vocabulary.js
const learnedManager = require('../../utils/learnedManager.js');
const wordManager = require('../../utils/wordManager.js');

Page({
  data: {
    bannerText: '就算切换课本MeowBread也会保存学习进度',
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
    const coverMap = {
      'everyones_japanese': 'https://free.picui.cn/free/2025/07/20/687bd47160e75.jpg',
      'liangs_class': 'https://free.picui.cn/free/2025/07/20/687bd4712b75f.jpg',
      'liangs_intermediate': 'https://free.picui.cn/free/2025/07/20/687bd4715697e.jpg',
      'duolingguo': 'https://free.picui.cn/free/2025/07/20/687bd47111ec1.jpg'
    };

    // 显示加载状态
    this.setData({
      categories: [{
        id: 'loading',
        title: '加载中...',
        dicts: []
      }]
    });

    const loadPromises = db.map(dict => (async () => {
      // 【性能优化】使用缓存函数获取总词数，避免重复计算
      const totalWordCount = await wordManager.getDictionaryWordCount(dict.id);
      // 获取学习进度
      const learningProgress = learnedManager.getLearningProgress(dict.id);
      // 计算进度百分比
      const progress = totalWordCount > 0 ? Math.round((learningProgress.learnedCount / totalWordCount) * 100) : 0;
      
      // 返回组装好的词典对象
      return {
        ...dict,
        wordCount: totalWordCount,
        progress: progress,
        learnedCount: learningProgress.learnedCount,
        totalCount: totalWordCount,
        cover: coverMap[dict.id] || ''
      };
    })());

    Promise.all(loadPromises).then(dicts => {
      const selectedDictionaryId = wx.getStorageSync('selectedDictionary');
      const db = require('../../database/dictionaries.js').dictionaries;
      const seriesGroups = {
        'liang': ['liangs_class', 'liangs_intermediate'],
        'everyone': ['everyones_japanese'],
        'duolingo': ['duolingguo']
      };

      const getBookSeries = (bookId) => {
        for (const [seriesName, books] of Object.entries(seriesGroups)) {
          if (books.includes(bookId)) {
            return seriesName;
          }
        }
        return 'other';
      };

      const sortDictsBySeriesAndSelection = (dictsArray) => {
        if (!selectedDictionaryId) {
          return dictsArray;
        }
        const selectedSeries = getBookSeries(selectedDictionaryId);
        return dictsArray.sort((a, b) => {
          const aIsSelected = a.id === selectedDictionaryId;
          const bIsSelected = b.id === selectedDictionaryId;
          const aIsInSelectedSeries = getBookSeries(a.id) === selectedSeries;
          const bIsInSelectedSeries = getBookSeries(b.id) === selectedSeries;
          if (aIsSelected) return -1;
          if (bIsSelected) return 1;
          if (aIsInSelectedSeries && !bIsInSelectedSeries) return -1;
          if (!aIsInSelectedSeries && bIsInSelectedSeries) return 1;
          const aOriginalIndex = db.findIndex(dict => dict.id === a.id);
          const bOriginalIndex = db.findIndex(dict => dict.id === b.id);
          return aOriginalIndex - bOriginalIndex;
        });
      };

      const categories = [{
        id: 'textbook',
        title: '课本Textbook',
        dicts: sortDictsBySeriesAndSelection(dicts.filter(d => d.id !== 'duolingguo'))
      }, {
        id: 'software',
        title: '其他Other',
        dicts: sortDictsBySeriesAndSelection(dicts.filter(d => d.id === 'duolingguo'))
      }];

      this.setData({
        categories
      });
    }).catch(error => {
      console.error("加载词典数据失败", error);
      this.setData({
        categories: [{
          id: 'error',
          title: '加载失败，请稍后重试',
          dicts: []
        }]
      });
    });
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
    // 重要的：更新自定义底部导航的选中状态，确保高亮正确
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
