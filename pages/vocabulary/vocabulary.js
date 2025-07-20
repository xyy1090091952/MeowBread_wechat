// pages/vocabulary/vocabulary.js
const learnedManager = require('../../utils/learnedManager.js');

Page({
  data: {
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

    const loadPromises = db.map(dict => {
      const lessonPromises = dict.lesson_files.map(filePath => {
        return new Promise((resolve, reject) => {
          wx.request({
            url: filePath,
            success: (res) => {
              if (res.statusCode === 200 && Array.isArray(res.data)) {
                resolve(res.data.length);
              } else {
                resolve(0); // 文件加载失败或格式不正确
              }
            },
            fail: (err) => {
              console.warn(`无法加载课时文件: ${filePath}`, err);
              resolve(0); // 网络错误
            }
          });
        });
      });

      return Promise.all(lessonPromises).then(wordCounts => {
        const totalWordCount = wordCounts.reduce((sum, count) => sum + count, 0);
        const learningProgress = learnedManager.getLearningProgress(dict.id);
        return {
          ...dict,
          wordCount: totalWordCount,
          progress: learningProgress.progress,
          learnedCount: learningProgress.learnedCount,
          totalCount: totalWordCount, // 使用从网络获取的准确总数
          cover: coverMap[dict.id] || ''
        };
      });
    });

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
