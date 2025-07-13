// pages/vocabulary/vocabulary.js
const learnedManager = require('../../utils/learnedManager.js');

Page({
  data: {
    bannerText: '切换课本 Meow Bread 会保留你之前的进度',
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
        'liangs_intermediate': '../../images/book/liang2.jpg',
        'duolingguo': '../../images/book/duolingguo.jpg'
      };
      let wordCount = 0;
      dict.lesson_files.forEach(filePath => {
        try {
          // 动态引入课时文件 (注意路径需相对当前 js)
          const lesson = require('../../database/' + filePath);
          if (Array.isArray(lesson)) {
            // 检查是否是新的数据格式（每个单词包装在data中）
            if (lesson.length > 0 && lesson[0].data) {
              wordCount += lesson.length;
            } else {
              // 旧格式：直接是单词数组
              wordCount += lesson.length;
            }
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

      return { 
        ...dict, 
        wordCount: finalWordCount, 
        progress, 
        learnedCount: learningProgress.learnedCount, // 添加已学单词数
        totalCount: learningProgress.totalCount, // 添加总单词数
        cover: coverMap[dict.id] || '' 
      };
    });

    // 获取用户选择的课本ID，用于优先排序
    // 从本地存储中读取用户之前选择的课本，如果没有选择则为空
    const selectedDictionaryId = wx.getStorageSync('selectedDictionary');
    
    // 调试信息：输出当前用户选择的课本ID
    console.log('=== Vocabulary页面排序调试 ===');
    console.log('当前用户选择的课本ID:', selectedDictionaryId);
    console.log('所有词典ID列表:', dicts.map(d => d.id));
    
    // 定义课本系列分组
    const seriesGroups = {
      'liang': ['liangs_class', 'liangs_intermediate'], // 梁老师系列
      'everyone': ['everyones_japanese'], // 大家的日语系列
      'duolingo': ['duolingguo'] // 多邻国系列
    };
    
    // 获取课本所属的系列
    const getBookSeries = (bookId) => {
      for (const [seriesName, books] of Object.entries(seriesGroups)) {
        if (books.includes(bookId)) {
          return seriesName;
        }
      }
      return 'other'; // 未分类的课本
    };
    
    // 智能排序函数：同系列课本优先级排序
    const sortDictsBySeriesAndSelection = (dictsArray) => {
      if (!selectedDictionaryId) {
        // 如果没有选择课本，按原顺序返回
        return dictsArray;
      }
      
      const selectedSeries = getBookSeries(selectedDictionaryId);
      console.log('用户选择的课本系列:', selectedSeries);
      
      return dictsArray.sort((a, b) => {
        const aIsSelected = a.id === selectedDictionaryId;
        const bIsSelected = b.id === selectedDictionaryId;
        const aIsInSelectedSeries = getBookSeries(a.id) === selectedSeries;
        const bIsInSelectedSeries = getBookSeries(b.id) === selectedSeries;
        
        // 1. 当前选择的课本排在最前面
        if (aIsSelected) return -1;
        if (bIsSelected) return 1;
        
        // 2. 同系列的课本排在其他系列前面
        if (aIsInSelectedSeries && !bIsInSelectedSeries) return -1;
        if (!aIsInSelectedSeries && bIsInSelectedSeries) return 1;
        
        // 3. 在同一优先级内，保持原有顺序（通过原始索引）
        const aOriginalIndex = db.findIndex(dict => dict.id === a.id);
        const bOriginalIndex = db.findIndex(dict => dict.id === b.id);
        return aOriginalIndex - bOriginalIndex;
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
        // 同时应用智能排序，让用户选择的课本和同系列课本排在前面
        dicts: sortDictsBySeriesAndSelection(dicts.filter(d => d.id !== 'duolingguo'))
      },
      {
        id: 'software',
        title: '其他Other',
        // 这里同样使用 filter 方法，筛选出 id 等于 'duolingguo' 的词典
        // 将 'duolingguo' 这个词典单独归类到"其他"类别下
        // 虽然这个分类只有一个词典，但为了保持代码一致性，也应用排序函数
        dicts: sortDictsBySeriesAndSelection(dicts.filter(d => d.id === 'duolingguo'))
      }
    ];

    // 调试信息：输出排序后的结果
    console.log('排序后的textbook分类:', categories[0].dicts.map(d => `${d.id} - ${d.name}`));
    console.log('排序后的software分类:', categories[1].dicts.map(d => `${d.id} - ${d.name}`));
    
    // 额外调试：显示系列分组信息
    if (selectedDictionaryId) {
      const selectedSeries = getBookSeries(selectedDictionaryId);
      console.log(`选择的课本 "${selectedDictionaryId}" 属于 "${selectedSeries}" 系列`);
      console.log('系列分组详情:', seriesGroups);
    }

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
