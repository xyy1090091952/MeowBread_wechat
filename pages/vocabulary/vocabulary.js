// pages/vocabulary/vocabulary.js
Page({
  data: {
    bannerText: 'Meow Bread 会记录你每一次的学习进度',
    categories: [] // [{id,title,dicts:[{id,name,wordCount,progress}] }]
  },

  onLoad() {
    this.prepareData();
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
    const categories = [
      {
        id: 'textbook',
        title: '课本Textbook',
        dicts: dicts.filter(d => d.id !== 'duolingguo')
      },
      {
        id: 'software',
        title: '软件Software',
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
    // 如果在开发者工具中，避免跳转，方便调试布局
    const platform = wx.getSystemInfoSync().platform;
    if (platform === 'devtools') {
      console.log('点击词典卡片', id);
      return;
    }
    wx.navigateTo({ url: `/pages/filter/filter?dictionaryId=${id}` });
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
})
