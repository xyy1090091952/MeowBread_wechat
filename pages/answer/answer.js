// pages/answer/answer.js
Page({
  data: {
    // 根据Figma设计稿，一级页面主要是选项，不直接展示题目信息
    currentFilterDisplay: '', // 用于显示当前题库筛选范围
    showTextbookSelector: false // 控制教材选择弹窗的显示
  },
  onLoad: function (options) {
    // 页面加载时可以进行一些初始化操作
    console.log('Page loaded with options:', options);

    // 检查是否已选择教材
    const selectedDict = wx.getStorageSync('selectedDictionary');
    if (!selectedDict) {
      this.setData({ showTextbookSelector: true });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('Page ready');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('Page show');
    // 页面显示时，从本地存储加载筛选条件并更新显示
    const quizFilter = wx.getStorageSync('quizFilter');
    const selectedDictId = wx.getStorageSync('selectedDictionary');
    let currentFilterDisplay = '请选择教材和课程'; // 默认提示

    if (quizFilter && quizFilter.selectedDictionaryName && quizFilter.selectedLessonName) {
      // 优先显示来自Filter页面的精确筛选结果
      currentFilterDisplay = `当前：${quizFilter.selectedDictionaryName} - ${quizFilter.selectedLessonName}`;
    } else if (selectedDictId) {
      // 如果没有精确筛选，则显示已选择的教材
      const dictionaries = require('../../database/dictionaries.js').dictionaries;
      const selectedDict = dictionaries.find(d => d.id === selectedDictId);
      if (selectedDict) {
        currentFilterDisplay = `当前：${selectedDict.name} - 全部课程`;
      }
    }

    this.setData({
      currentFilterDisplay: currentFilterDisplay
    });

    // 更新自定义底部导航的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const page = getCurrentPages().pop();
      const route = page.route;
      const tabList = this.getTabBar().data.tabList;
      const index = tabList.findIndex(item => item.pagePath === route);
      if (index !== -1) {
        this.getTabBar().updateSelected(index);
      }
    }
  },

  /** 关闭教材选择弹窗 */
  onCloseSelector() {
    this.setData({ showTextbookSelector: false });
    const selectedDictId = wx.getStorageSync('selectedDictionary');
    // 如果用户关闭弹窗时，仍然没有任何已选教材，则设置一个默认值
    if (!selectedDictId) {
      const defaultDictionaryId = 'everyones_japanese';
      const allDictionaries = require('../../database/dictionaries.js').dictionaries;
      const defaultDictionary = allDictionaries.find(d => d.id === defaultDictionaryId);

      if (defaultDictionary) {
        // 构建一个与 filter 页面保存的结构一致的 quizFilter 对象
        const quizFilter = {
          selectedDictionaryIndex: allDictionaries.findIndex(d => d.id === defaultDictionaryId) + 1, // +1因为有'全部辞典'
          selectedLessonFiles: [`DICTIONARY_${defaultDictionary.id}_ALL_LESSONS`],
          selectedLessonName: '全部课程',
          selectedDictionaryName: defaultDictionary.name,
          dictionaryId: defaultDictionary.id,
          basePath: defaultDictionary.base_path || '',
          quizMode: 'quick',
          selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill']
        };

        // 保存完整的筛选条件和已选词典ID
        wx.setStorageSync('quizFilter', quizFilter);
        wx.setStorageSync('selectedDictionary', defaultDictionary.id);

        // 更新UI显示
        this.setData({
          currentFilterDisplay: `当前：${defaultDictionary.name} - 全部课程`
        });

        wx.showToast({
          title: '已为您选择默认教材',
          icon: 'none',
          duration: 1500
        });
      }
    }
  },

  /** 处理教材选择 */
  onSelectTextbook(e) {
    const { selectedDictionary } = e.detail; // 从事件中获取完整的词典对象
    if (!selectedDictionary || !selectedDictionary.id) {
      console.error('onSelectTextbook: 无效的 selectedDictionary');
      this.setData({ showTextbookSelector: false });
      return;
    }

    // 加载所有词典以找到索引
    const allDictionaries = require('../../database/dictionaries.js').dictionaries;
    const dictionariesWithAllOption = [{ id: 'all', name: '全部辞典' }, ...allDictionaries];
    const dictionaryIndex = dictionariesWithAllOption.findIndex(d => d.id === selectedDictionary.id);

    // 构建一个与 filter 页面保存的结构一致的 quizFilter 对象
    const quizFilter = {
      selectedDictionaryIndex: dictionaryIndex !== -1 ? dictionaryIndex : 0,
      selectedLessonFiles: [`DICTIONARY_${selectedDictionary.id}_ALL_LESSONS`], // 默认选择该教材的全部课程
      selectedLessonName: '全部课程',
      selectedDictionaryName: selectedDictionary.name,
      dictionaryId: selectedDictionary.id,
      basePath: selectedDictionary.base_path || '',
      quizMode: 'quick', // 默认为快速答题模式
      // 首次选择时，使用默认的题型
      selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill']
    };

    // 保存完整的筛选条件
    wx.setStorageSync('quizFilter', quizFilter);
    // 为了兼容旧逻辑或其他地方可能的直接引用，也保存一份 selectedDictionary
    wx.setStorageSync('selectedDictionary', selectedDictionary.id);

    // 更新页面显示并关闭弹窗
    this.setData({
      showTextbookSelector: false,
      currentFilterDisplay: `当前：${selectedDictionary.name} - 全部课程`
    });

    wx.showToast({
      title: '教材已选择',
      icon: 'success',
      duration: 1500
    });
  },

  

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log('Page hide');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('Page unload');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('User pulled down');
    // 可以在这里添加下拉刷新的逻辑
    // wx.stopPullDownRefresh(); // 处理完成后停止下拉刷新动画
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('Reached bottom');
    // 可以在这里添加上拉加载更多的逻辑
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    console.log('Share app message');
    return {
      title: 'MeowBread - 一起学日语吧！',
      path: '/pages/answer/answer', // 分享路径
      imageUrl: '' // 可以自定义分享图片的路径
    };
  },

  /**
   * 跳转到题库筛选页面
   */
  navigateToFilter() {
    console.log('Navigate to Filter');
    // 跳转到筛选页面时，可以传递一个默认的答题模式，例如 'quick'
    // filter.js 的 onLoad 会接收这个 mode
    wx.navigateTo({ url: '/pages/filter/filter?mode=quick' });
  },

  /**
   * 开始快速答题
   */
  startQuickQuiz() {
    console.log('Start Quick Quiz');
    let quizFilter = wx.getStorageSync('quizFilter');

    if (!quizFilter || !quizFilter.selectedLessonFiles || quizFilter.selectedLessonFiles.length === 0) {
      quizFilter = {
        selectedDictionaryName: '全部辞典',
        selectedLessonFiles: ['ALL_DICTIONARIES_ALL_LESSONS'],
        selectedLessonName: '全部课程',
        dictionaryId: 'all',
        basePath: 'all',
      };
    }

    quizFilter.quizMode = 'quick';
    wx.setStorageSync('quizFilter', quizFilter);

    wx.navigateTo({
      url: `/pages/quiz/quiz?mode=quick`
    });
  },

  /**
   * 开始无尽模式
   */
  startEndlessQuiz() {
    console.log('Start Endless Quiz');
    let quizFilter = wx.getStorageSync('quizFilter');

    // 检查是否存在有效的筛选条件，如果没有，则创建一个默认的
    if (!quizFilter || !quizFilter.selectedLessonFiles || quizFilter.selectedLessonFiles.length === 0) {
      quizFilter = {
        selectedDictionaryName: '全部辞典',
        selectedLessonFiles: ['ALL_DICTIONARIES_ALL_LESSONS'], // 修正为复数
        selectedLessonName: '全部课程',
        dictionaryId: 'all',
        basePath: 'all',
      };
    }

    // 将模式设置为 'endless' 并保存回本地存储
    quizFilter.quizMode = 'endless';
    wx.setStorageSync('quizFilter', quizFilter);

    // 导航到 quiz 页面，quiz 页面会从本地存储读取完整的筛选条件
    wx.navigateTo({
      url: '/pages/quiz/quiz?mode=endless'
    });
  },

  /**
   * 错题重练
   */
  practiceWrongQuestions() {
    console.log('Practice Wrong Questions');
    wx.showToast({
      title: '功能开发中...',
      icon: 'none', // 不显示图标，只显示文本
      duration: 2000 // 提示持续时间，单位毫秒
    });
  }
})
