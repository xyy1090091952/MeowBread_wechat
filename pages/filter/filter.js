// pages/filter/filter.js
const app = getApp();
const filterManager = require('../../utils/filterManager.js');

// 词典数据将从 database/dictionaries.json 动态加载

Page({

  /**
   * 页面的初始数据
   */
  data: {
    dictionaries: [], // 词典列表，包含“全部辞典”
    selectedDictionaryIndex: 0, // 默认选中“全部辞典”
    lessons: [], // 课程列表，每个课程对象将包含 checked 属性
    selectedLessonFiles: [], // 用于存储所有选中的课程文件
    quizMode: 'quick', // 默认答题模式
    allDictionariesOption: { id: 'all', name: '全部辞典', description: '所有可用词典中的全部课程', base_path: 'all' },
    // allLessonsOption 和 dictionaryAllLessonsOptionTemplate 将在 updateLessonsBasedOnDictionary 中动态创建
    questionTypeOptions: [
      { name: '根据中文意思选日语', value: 'zh_to_jp_choice', checked: true, category: '选择题' },
      { name: '根据日语选中文', value: 'jp_to_zh_choice', checked: true, category: '选择题' },
      { name: '根据中文意思写日语', value: 'zh_to_jp_fill', checked: true, category: '填空题' },
      { name: '根据日文汉字写假名', value: 'jp_kanji_to_kana_fill', checked: true, category: '填空题' }
    ],
    selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'], // 默认全部选中
    isSelectorVisible: false, // 控制教材选择弹窗的显示与隐藏
    isQuestionTypePopupVisible: false // 控制题型选择弹窗的显示与隐藏
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 尝试从全局或本地存储中读取已保存的筛选条件
    const savedFilter = filterManager.getFilter();
    let dataToSet = {
      quizMode: options.mode || 'quick' // 默认值
    };

    if (savedFilter) {
      dataToSet.selectedDictionaryIndex = savedFilter.selectedDictionaryIndex !== undefined ? savedFilter.selectedDictionaryIndex : this.data.selectedDictionaryIndex;
      dataToSet.selectedLessonFiles = savedFilter.selectedLessonFiles || [];
      dataToSet.quizMode = savedFilter.quizMode || options.mode || 'quick';
    }

    // 恢复题型选择
    if (savedFilter && savedFilter.selectedQuestionTypes) {
      dataToSet.selectedQuestionTypes = savedFilter.selectedQuestionTypes;
      // 更新 questionTypeOptions 的选中状态
      const newQuestionTypeOptions = this.data.questionTypeOptions.map(opt => {
        return {...opt, checked: savedFilter.selectedQuestionTypes.includes(opt.value)};
      });
      dataToSet.questionTypeOptions = newQuestionTypeOptions;
    } else {
      // 如果没有保存的题型，则使用默认值，并确保 questionTypeOptions 的 checked 状态正确
      const defaultSelectedTypes = this.data.selectedQuestionTypes;
      const newQuestionTypeOptions = this.data.questionTypeOptions.map(opt => {
        return {...opt, checked: defaultSelectedTypes.includes(opt.value)};
      });
      dataToSet.questionTypeOptions = newQuestionTypeOptions;
    }

    this.setData(dataToSet, () => {
      // 确保 setData 完成后才加载词典和课程
      this.loadDictionariesAndLessons(); // 这会基于（可能已恢复的）selectedDictionaryIndex 更新 lessons
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

  // 显示教材选择弹窗
  showTextbookSelector() {
    console.log('showTextbookSelector called. Setting isSelectorVisible to true.');
    this.setData({ isSelectorVisible: true });
  },

  // 处理教材选择确认事件
  onConfirmTextbook(e) {
    const { selectedDictionary } = e.detail;
    const dictionaryIndex = this.data.dictionaries.findIndex(dict => dict.id === selectedDictionary.id);

    // 切换教材时，重置课程选择为新教材的“全部课程”
    const newSelectedLessonFiles = [`DICTIONARY_${selectedDictionary.id}_ALL_LESSONS`];

    this.setData({
      selectedDictionaryIndex: dictionaryIndex,
      isSelectorVisible: false,
      selectedLessonFiles: newSelectedLessonFiles // 应用新的课程选择
    }, () => {
      // setData 回调中执行后续操作，确保数据已更新
      this.updateLessonsBasedOnDictionary();
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
        // 加载所有在 dictionaries.js 中定义的词典
        dictionariesData.dictionaries.forEach(dict => {
          // 确保每个词典对象都包含必要的字段，特别是 id 和 name
          // base_path 和 lesson_files 主要由 quiz.js 使用，但保持结构一致性是好的
          if (dict.id && dict.name) {
            dictionariesToDisplay.push(dict);
          }
        });
        if (dictionariesToDisplay.length === 1) { // 只有 '全部辞典'
          console.warn('dictionaries.js 中没有配置任何有效词典。');
          wx.showToast({
            title: '没有可用的词典',
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
      // selectedDictionaryIndex 应该在 onLoad 中从缓存恢复，这里不再强制设为0
      // 如果 onLoad 中没有恢复，其初始值或 onLoad 中设置的默认值会被保留
      // 若 onLoad 中已从 savedFilter 恢复了 selectedDictionaryIndex，则使用该值
      // 否则，使用 data 中定义的默认值或 onLoad 中未找到 savedFilter 时设置的默认值
      selectedDictionaryIndex: this.data.selectedDictionaryIndex 
    });
    this.updateLessonsBasedOnDictionary(); // 根据选中的词典加载课程
  },

  // 根据当前选中的词典更新课程列表
  updateLessonsBasedOnDictionary() {
    const selectedDictIndex = this.data.selectedDictionaryIndex;
    const selectedDictionary = this.data.dictionaries[selectedDictIndex];
    let lessonsToShow = [];

    if (selectedDictionary.id === 'all') {
      // “全部辞典”模式下，不显示课程选择
      this.setData({ lessons: [], selectedLessonFiles: [] });
      return;
    }

    // 特定词典模式
    const allLessonsOption = {
      name: '全部课程',
      file: `DICTIONARY_${selectedDictionary.id}_ALL_LESSONS`,
      checked: false
    };
    lessonsToShow.push(allLessonsOption);

    if (selectedDictionary.lesson_files && Array.isArray(selectedDictionary.lesson_files)) {
      selectedDictionary.lesson_files.forEach(lessonFilePattern => {
        let lessonName = lessonFilePattern.split('/').pop().replace('.js', '');
        lessonsToShow.push({
          name: `课程: ${lessonName}`,
          file: `${selectedDictionary.id}_${lessonName}`,
          checked: false
        });
      });
    }

    // 恢复或设置选中状态
    const currentSelectedFiles = this.data.selectedLessonFiles || [];
    
    // 检查“全部课程”选项是否应该被选中
    const isAllLessonsSelected = currentSelectedFiles.includes(allLessonsOption.file);

    if (isAllLessonsSelected) {
      // 如果“全部课程”被选中，则所有课程都应被勾选
      lessonsToShow.forEach(lesson => lesson.checked = true);
    } else {
      // 否则，根据 currentSelectedFiles 单独判断每个课程的选中状态
      let allIndividualLessonsChecked = lessonsToShow.length > 1; // 初始假设所有单独课程都被选中
      lessonsToShow.forEach(lesson => {
        if (lesson.file !== allLessonsOption.file) {
          if (currentSelectedFiles.includes(lesson.file)) {
            lesson.checked = true;
          } else {
            lesson.checked = false;
            allIndividualLessonsChecked = false; // 只要有一个未选中，整体就不是全选
          }
        }
      });
      // 更新“全部课程”的勾选状态
      allLessonsOption.checked = allIndividualLessonsChecked;
    }
    
    // 最终更新 lessons 列表到页面，并确保 selectedLessonFiles 也被正确设置
    this.setData({
      lessons: lessonsToShow,
      selectedLessonFiles: currentSelectedFiles
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

  onLessonCheckboxChange(e) {
    const clickedFile = e.currentTarget.dataset.file;
    let lessons = JSON.parse(JSON.stringify(this.data.lessons));
    let selectedFiles = [];

    const allLessonsOption = lessons.find(l => l.file.includes('_ALL_LESSONS'));
    const isAllLessonsOptionClick = clickedFile === allLessonsOption.file;

    if (isAllLessonsOptionClick) {
      // 点击了“全部课程”
      const shouldSelectAll = !allLessonsOption.checked;
      lessons.forEach(lesson => lesson.checked = shouldSelectAll);
      if (shouldSelectAll) {
        // 如果选中“全部课程”，selectedFiles 只包含这一个标识
        selectedFiles = [allLessonsOption.file];
      } else {
        // 如果取消“全部课程”，则清空所有选择
        selectedFiles = [];
      }
    } else {
      // 点击了单个课程
      const clickedLesson = lessons.find(l => l.file === clickedFile);
      if (clickedLesson) {
        clickedLesson.checked = !clickedLesson.checked;
      }

      // 检查除“全部课程”外的所有课程是否都已选中
      const allOtherLessonsChecked = lessons.filter(l => !l.file.includes('_ALL_LESSONS')).every(l => l.checked);
      
      if (allLessonsOption) {
        allLessonsOption.checked = allOtherLessonsChecked;
      }

      if (allOtherLessonsChecked) {
        // 如果所有单个课程都选中了，等同于选中“全部课程”
        selectedFiles = [allLessonsOption.file];
      } else {
        // 否则，只包含选中的单个课程
        selectedFiles = lessons.filter(l => l.checked && !l.file.includes('_ALL_LESSONS')).map(l => l.file);
      }
    }

    this.setData({
      lessons: lessons,
      selectedLessonFiles: selectedFiles
    }, () => {
      this.saveFilterSettings();
    });
  },

  // 保存筛选条件到本地存储
  saveFilterSettings() {
    const selectedDict = this.data.dictionaries[this.data.selectedDictionaryIndex];
    let lessonName = '请选择课程';
    const selectedCount = this.data.selectedLessonFiles.filter(file => !file.includes('_ALL_LESSONS')).length;
    const allLessonsFile = `DICTIONARY_${selectedDict.id}_ALL_LESSONS`;

    if (this.data.selectedLessonFiles.includes(allLessonsFile)) {
      lessonName = '全部课程';
    } else if (selectedCount > 0) {
      lessonName = `${selectedCount}个课程`;
    }

    const filterToSave = {
      selectedDictionaryIndex: this.data.selectedDictionaryIndex,
      selectedLessonFiles: this.data.selectedLessonFiles,
      selectedDictionaryName: selectedDict.name,
      selectedLessonName: lessonName,
      dictionaryId: selectedDict.id,
      basePath: selectedDict.base_path || '',
      quizMode: this.data.quizMode,
      selectedQuestionTypes: this.data.selectedQuestionTypes
    };
    filterManager.saveFilter(filterToSave);
    console.log('Filter settings saved:', filterToSave);
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