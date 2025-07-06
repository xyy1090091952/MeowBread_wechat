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
    isQuestionTypePopupVisible: false,
    areAllLessonsSelected: false, // 新增：是否全选
    displayedLessonsCount: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const initialState = filterService.initializeFilterState(options);
    this.setData(initialState, () => {
      this.updateLessonState();
    });
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

  // 新增：根据课程列表和选中的词典，获取更新后的 selectedLessonFiles
  getUpdatedSelectedLessonFiles(lessons, selectedDict) {
    const actualLessons = lessons.filter(lesson => lesson.name !== '全部课程');
    const areAllSelected = actualLessons.length > 0 && actualLessons.every(lesson => lesson.checked);

    if (areAllSelected) {
      // 如果所有课程都被选中，则返回一个代表“全部课程”的特殊文件标识
      return [`DICTIONARY_${selectedDict.id}_ALL_LESSONS`];
    } else {
      // 否则，返回被选中的课程文件列表
      return actualLessons
        .filter(lesson => lesson.checked)
        .map(lesson => lesson.file);
    }
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

    // 切换词典时，获取新课程列表
    const newLessons = filterService.getLessonsForDictionary(selectedDictionary, []);

    // 默认全选所有课程（除了“全部课程”）
    const lessonsWithSelection = newLessons.map(l => ({ ...l, checked: l.name !== '全部课程' }));
    
    // 使用新方法计算 selectedLessonFiles
    const newSelectedLessonFiles = this.getUpdatedSelectedLessonFiles(lessonsWithSelection, selectedDictionary);

    this.setData({
      selectedDictionaryIndex: dictionaryIndex,
      lessons: lessonsWithSelection,
      selectedLessonFiles: newSelectedLessonFiles,
      isSelectorVisible: false
    }, () => {
      this.saveFilterSettings();
      this.updateLessonState();
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
    }, () => {
      this.updateLessonState();
    });
  },

  onLessonCheckboxChange(e) {
    const clickedFile = e.currentTarget.dataset.file;
    // 直接在这里处理逻辑，不再依赖 filterService
    let { lessons } = this.data;

    const newLessons = lessons.map(lesson => {
      if (lesson.file === clickedFile) {
        return { ...lesson, checked: !lesson.checked };
      }
      return lesson;
    });

    const newSelectedLessonFiles = this.getUpdatedSelectedLessonFiles(newLessons, this.data.dictionaries[this.data.selectedDictionaryIndex]);

    this.setData({
      lessons: newLessons,
      selectedLessonFiles: newSelectedLessonFiles
    }, () => {
      this.saveFilterSettings();
      this.updateLessonState();
    });
  },

  // 更新课程状态，包括是否全选和显示的课程数量
  updateLessonState() {
    const actualLessons = this.data.lessons.filter(lesson => lesson.name !== '全部课程');
    const areAllSelected = actualLessons.length > 0 && actualLessons.every(lesson => lesson.checked);
    this.setData({
      areAllLessonsSelected: areAllSelected,
      displayedLessonsCount: actualLessons.length
    });
  },

  // 全选/取消全选
  toggleSelectAll() {
    const { lessons, areAllLessonsSelected } = this.data;
    const selectAll = !areAllLessonsSelected;
    
    const newLessons = lessons.map(lesson => {
      // “全部课程”选项的状态保持不变，不参与全选切换
      if (lesson.name === '全部课程') {
        return lesson;
      }
      return { ...lesson, checked: selectAll };
    });

    const newSelectedLessonFiles = this.getUpdatedSelectedLessonFiles(newLessons, this.data.dictionaries[this.data.selectedDictionaryIndex]);

    this.setData({
      lessons: newLessons,
      selectedLessonFiles: newSelectedLessonFiles,
      areAllLessonsSelected: selectAll
    }, () => {
      this.saveFilterSettings();
      this.updateLessonState();
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