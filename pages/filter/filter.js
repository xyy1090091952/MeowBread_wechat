// pages/filter/filter.js
const app = getApp();

// 词典数据将从 database/dictionaries.json 动态加载

Page({

  /**
   * 页面的初始数据
   */
  data: {
    dictionaries: [], // 词典列表，包含“全部辞典”
    selectedDictionaryIndex: 0, // 默认选中“全部辞典”
    lessons: [], // 课程列表
    selectedLessonFile: 'ALL_DICTIONARIES_ALL_LESSONS', // 默认选中“全部课程”
    selectedLessonIndex: 0, // 默认选中第一个课程选项
    quizMode: 'quick', // 默认答题模式
    allDictionariesOption: { id: 'all', name: '全部辞典', description: '所有可用词典中的全部课程', base_path: 'all' },
    allLessonsOption: { name: '全部课程', file: 'ALL_DICTIONARIES_ALL_LESSONS' },
    dictionaryAllLessonsOptionTemplate: { name: '该词典的全部课程', file: 'DICTIONARY_{id}_ALL_LESSONS' }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      quizMode: options.mode || 'quick'
    });
    this.loadDictionariesAndLessons();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 加载词典和课程列表的逻辑
  loadDictionariesAndLessons() {
    let dictionariesToDisplay = [this.data.allDictionariesOption]; // 默认包含“全部辞典”
    try {
      // 使用 FileSystemManager 读取 JSON 文件
      const fs = wx.getFileSystemManager();
      // 小程序中，包内文件路径可以直接用相对路径，但 fs 通常用于用户文件或包外文件。
      // 对于项目内的 JSON，require 是首选。如果 require 持续出问题，
      // 并且确认不是缓存或工具问题，才考虑 fs。但 fs 读取包内文件需要特定路径格式。
      // 微信开发者工具的模拟器中，'../../database/dictionaries.json' 理论上应该能被 require 正确解析为 JSON。
      // 错误 `module 'database/dictionaries.json.js' is not defined` 仍然指向 require 的行为。
      // 再次确认 require 的使用，并添加日志。
      console.log("Filter.js: 尝试通过 require 加载 '../../database/dictionaries.js'");
      const dictionariesData = require('../../database/dictionaries.js'); // 更新 require 路径
      console.log("Filter.js: dictionaries.js 加载结果:", dictionariesData);

      if (dictionariesData && dictionariesData.dictionaries) {
        const duolingguoDictionary = dictionariesData.dictionaries.find(d => d.id === 'duolingguo');
        if (duolingguoDictionary) {
          // 将 duolingguo 词典添加到显示列表
          // 我们需要确保它的结构与 allDictionariesOption 一致，特别是 name, id, description, base_path
          // dictionaries.json 中的结构已经是 {id, name, description, lesson_files, base_path}
          // 其中 lesson_files 在 filter.js 当前逻辑下不直接使用，base_path 会被 quiz.js 使用
          dictionariesToDisplay.push(duolingguoDictionary);
        } else {
          console.warn('未在 dictionaries.json 中找到 id 为 "duolingguo" 的词典。');
          wx.showToast({
            title: '多邻国词典未配置',
            icon: 'none',
            duration: 2000
          });
        }
      } else {
        console.error('无法加载或解析 dictionaries.json');
        wx.showToast({
          title: '词典列表加载失败',
          icon: 'error',
          duration: 2000
        });
      }
    } catch (e) {
      console.error('Filter.js: 加载 dictionaries.js 失败 (通过 require):', e);
      wx.showToast({
        title: '词典配置错误',
        icon: 'error',
        duration: 2000
      });
    }

    this.setData({
      dictionaries: dictionariesToDisplay,
      selectedDictionaryIndex: 0, // 默认选中第一个选项（“全部辞典”或唯一的“多邻国”）
    });
    this.updateLessonsBasedOnDictionary(); // 根据选中的词典加载课程
  },

  // 根据当前选中的词典更新课程列表
  updateLessonsBasedOnDictionary() {
    const selectedDictIndex = this.data.selectedDictionaryIndex;
    const selectedDictionary = this.data.dictionaries[selectedDictIndex];

    let lessonsToShow = [];
    let defaultLessonFile = null;

    if (selectedDictionary.id === 'all') {
      lessonsToShow = [this.data.allLessonsOption];
      defaultLessonFile = this.data.allLessonsOption.file;
    } else {
      // 对于特定词典，也只显示“该词典的全部课程”选项
      const specificDictAllLessonsOption = {
        name: `该词典 (${selectedDictionary.name}) 的全部课程`,
        file: `DICTIONARY_${selectedDictionary.id}_ALL_LESSONS`
      };
      lessonsToShow = [specificDictAllLessonsOption];
      defaultLessonFile = specificDictAllLessonsOption.file;
    }

    this.setData({
      lessons: lessonsToShow,
      selectedLessonIndex: 0,
      selectedLessonFile: defaultLessonFile
    });
  },

  // 当选择的词典变化时
  onDictionaryChange(e) {
    const index = parseInt(e.detail.value, 10);
    this.setData({
      selectedDictionaryIndex: index,
    });
    this.updateLessonsBasedOnDictionary();
  },

  // 当选择的课程变化时
  onLessonChange(e) {
    const lessonIndex = parseInt(e.detail.value, 10);
    if (this.data.lessons && this.data.lessons[lessonIndex]) {
      this.setData({
        selectedLessonIndex: lessonIndex,
        selectedLessonFile: this.data.lessons[lessonIndex].file
      });
    } else {
      // 理论上，由于课程列表只有一个选项，这里不太会出错，但保留以防万一
      console.warn('选择的课程索引无效:', lessonIndex);
      // 如果真的发生，则重置为当前词典的默认课程选项
      this.updateLessonsBasedOnDictionary(); 
    }
  },

  // 开始答题
  startQuiz() {
    if (!this.data.selectedLessonFile) {
      wx.showToast({
        title: '请选择范围',
        icon: 'none'
      });
      return;
    }

    const selectedDictionary = this.data.dictionaries[this.data.selectedDictionaryIndex];
    let dictionaryIdToSend = selectedDictionary.id; // 'all' 或具体的词典ID
    let lessonFileToSend = this.data.selectedLessonFile; // 'ALL_DICTIONARIES_ALL_LESSONS' 或 'DICTIONARY_{id}_ALL_LESSONS'
    
    // 如果选的是具体词典，我们传递词典的 base_path，quiz.js 会需要它来定位课程文件
    // 如果选的是“全部辞典”，则不需要 base_path，因为 quiz.js 会处理所有词典
    let basePathToSend = (dictionaryIdToSend !== 'all') ? selectedDictionary.base_path : '';

    wx.navigateTo({
      url: `/pages/quiz/quiz?lessonFile=${encodeURIComponent(lessonFileToSend)}&mode=${this.data.quizMode}&dictionaryId=${encodeURIComponent(dictionaryIdToSend)}&basePath=${encodeURIComponent(basePathToSend)}`
    });
  }

})