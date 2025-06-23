// pages/filter/filter.js
const app = getApp();
const filterService = require('../../utils/filter.service.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    dictionaries: [],
    selectedDictionaryIndex: 0,
    lessons: [],
    selectedLessonFiles: [],
    quizMode: 'quick',
    questionTypeOptions: [],
    selectedQuestionTypes: [],
    isSelectorVisible: false,
    isQuestionTypePopupVisible: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const initialState = filterService.initializeFilterState(options);
    this.setData(initialState);
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

  // 显示教材选择弹窗
  showTextbookSelector() {
    console.log('showTextbookSelector called. Setting isSelectorVisible to true.');
    this.setData({ isSelectorVisible: true });
  },

  // 处理教材选择确认事件
  onConfirmTextbook(e) {
    const { selectedDictionary } = e.detail;
    const dictionaryIndex = this.data.dictionaries.findIndex(dict => dict.id === selectedDictionary.id);

    // 切换词典时，默认全选所有课程
    const allLessonsFile = `DICTIONARY_${selectedDictionary.id}_ALL_LESSONS`;
    const newSelectedLessonFiles = selectedDictionary.id === 'all' ? [] : [allLessonsFile];
    const newLessons = filterService.getLessonsForDictionary(selectedDictionary, newSelectedLessonFiles);

    this.setData({
      selectedDictionaryIndex: dictionaryIndex,
      lessons: newLessons,
      selectedLessonFiles: newSelectedLessonFiles,
      isSelectorVisible: false
    }, () => {
      this.saveFilterSettings();
    });
  },

  // 处理教材选择取消事件
  onCancelTextbook() {
    this.setData({ isSelectorVisible: false });
  },

  // 显示题型选择弹窗
  showQuestionTypePopup() {
    this.setData({ isQuestionTypePopupVisible: true });
  },

  // 关闭题型选择弹窗
  onCloseQuestionTypePopup() {
    this.setData({ isQuestionTypePopupVisible: false });
  },

  // 确认题型选择
  onConfirmQuestionTypePopup(e) {
    const { selectedQuestionTypes, questionTypeOptions } = e.detail;
    this.setData({
      selectedQuestionTypes,
      questionTypeOptions,
      isQuestionTypePopupVisible: false
    }, () => {
      this.saveFilterSettings();
    });
  },



  

  

  onDictionaryChange(e) {
    const index = parseInt(e.detail.value, 10);
    const selectedDictionary = this.data.dictionaries[index];
    
    // 切换词典时，默认全选所有课程
    const allLessonsFile = `DICTIONARY_${selectedDictionary.id}_ALL_LESSONS`;
    const newSelectedLessonFiles = selectedDictionary.id === 'all' ? [] : [allLessonsFile];
    const newLessons = filterService.getLessonsForDictionary(selectedDictionary, newSelectedLessonFiles);

    this.setData({
      selectedDictionaryIndex: index,
      lessons: newLessons,
      selectedLessonFiles: newSelectedLessonFiles
    });
  },

  onLessonCheckboxChange(e) {
    const clickedFile = e.currentTarget.dataset.file;
    const { lessons, selectedLessonFiles } = filterService.handleLessonCheckboxChange(this.data.lessons, clickedFile);

    this.setData({
      lessons,
      selectedLessonFiles
    }, () => {
      this.saveFilterSettings();
    });
  },

  saveFilterSettings() {
    filterService.saveFilterSettings(this.data);
  },

  // 完成选择并保存筛选条件的逻辑
  startQuiz() { 
    if (this.data.selectedLessonFiles.length === 0) {
      wx.showToast({
        title: '请选择课程范围',
        icon: 'none'
      });
      return;
    }
    // 确保至少选择了一个题型
    if (!this.data.selectedQuestionTypes || this.data.selectedQuestionTypes.length === 0) {
      wx.showToast({
        title: '请至少选择一种题型',
        icon: 'none'
      });
      return;
    }

    this.saveFilterSettings(); // 调用保存函数

    wx.showToast({
      title: '筛选条件已保存',
      icon: 'success',
      duration: 1500,
      complete: () => {
        wx.switchTab({
          url: '/pages/answer/answer' 
        });
      }
    });
  }

})