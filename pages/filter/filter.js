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
    dictionaryAllLessonsOptionTemplate: { name: '该词典的全部课程', file: 'DICTIONARY_{id}_ALL_LESSONS' },
    questionTypeOptions: [
      { name: '根据中文意思选日语', value: 'zh_to_jp_choice', checked: true, category: '选择题' },
      { name: '根据日语选中文', value: 'jp_to_zh_choice', checked: true, category: '选择题' },
      { name: '根据中文意思写日语', value: 'zh_to_jp_fill', checked: true, category: '填空题' },
      { name: '根据日文汉字写假名', value: 'jp_kanji_to_kana_fill', checked: true, category: '填空题' }
    ],
    selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'] // 默认全部选中
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 尝试从全局或本地存储中读取已保存的筛选条件
    const savedFilter = wx.getStorageSync('quizFilter');
    let dataToSet = {
      quizMode: options.mode || 'quick' // 默认值
    };

    if (savedFilter) {
      dataToSet.selectedDictionaryIndex = savedFilter.selectedDictionaryIndex !== undefined ? savedFilter.selectedDictionaryIndex : this.data.selectedDictionaryIndex;
      dataToSet.selectedLessonFile = savedFilter.selectedLessonFile || this.data.selectedLessonFile;
      dataToSet.quizMode = savedFilter.quizMode || options.mode || 'quick';
      // selectedLessonIndex 的恢复将在 loadDictionariesAndLessons 之后，通过匹配 selectedLessonFile 进行
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

  // 处理题型选择变化的函数
  onQuestionTypeChange(e) {
    const { value } = e.currentTarget.dataset; // 获取当前操作的 switch 的 value，即题型代码
    const checked = e.detail.value; // 获取当前 switch 的选中状态 (true/false)

    let currentSelectedTypes = [...this.data.selectedQuestionTypes];

    if (checked) {
      // 如果是选中，则添加到 selectedQuestionTypes
      if (!currentSelectedTypes.includes(value)) {
        currentSelectedTypes.push(value);
      }
    } else {
      // 如果是取消选中
      // 校验是否是最后一个被选中的题型
      if (currentSelectedTypes.length === 1 && currentSelectedTypes[0] === value) {
        wx.showToast({
          title: '至少选择一种题型',
          icon: 'none'
        });
        // 阻止取消，需要将 UI 恢复
        const newQuestionTypeOptions = this.data.questionTypeOptions.map(opt => {
          if (opt.value === value) {
            return { ...opt, checked: true }; // 强制改回选中状态
          }
          return opt;
        });
        this.setData({
          questionTypeOptions: newQuestionTypeOptions
        });
        return; // 提前返回，不更新 selectedQuestionTypes
      }
      // 移除该题型
      currentSelectedTypes = currentSelectedTypes.filter(type => type !== value);
    }

    const newQuestionTypeOptions = this.data.questionTypeOptions.map(opt => {
      return { ...opt, checked: currentSelectedTypes.includes(opt.value) };
    });

    this.setData({
      selectedQuestionTypes: currentSelectedTypes,
      questionTypeOptions: newQuestionTypeOptions
    });

    // 保存筛选条件到本地存储
    this.saveFilterSettings();
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
    let defaultLessonFile = null;

    if (selectedDictionary.id === 'all') {
      lessonsToShow = [this.data.allLessonsOption];
      defaultLessonFile = this.data.allLessonsOption.file;
    } else {
      // 对于特定词典，显示“该词典的全部课程”选项
      const specificDictAllLessonsOption = {
        name: `该词典 (${selectedDictionary.name}) 的全部课程`,
        file: `DICTIONARY_${selectedDictionary.id}_ALL_LESSONS` // quiz.js 会处理这个特殊的 file 标识
      };
      lessonsToShow = [specificDictAllLessonsOption];
      
      // 动态加载该词典下的具体课程文件作为选项 (确保它们是 .js)
      if (selectedDictionary.lesson_files && Array.isArray(selectedDictionary.lesson_files)) {
        selectedDictionary.lesson_files.forEach(lessonFilePattern => {
          let lessonName = lessonFilePattern;
          if (lessonFilePattern.includes('/')) {
            lessonName = lessonFilePattern.split('/').pop(); // 获取文件名如 lesson1.js
          }
          lessonName = lessonName.replace('.json', '.js'); // 确保是 .js
          const lessonDisplayName = lessonName.replace('.js', ''); // 用于显示，如 lesson1
          
          // file 属性需要一个 quiz.js 能解析的唯一标识
          // 例如 'dictionaryId_lessonName' (不含.js后缀)
          lessonsToShow.push({
            name: `课程: ${lessonDisplayName}`,
            file: `${selectedDictionary.id}_${lessonDisplayName}` 
          });
        });
      }
      // 默认选中“该词典的全部课程”
      defaultLessonFile = specificDictAllLessonsOption.file;
    }

    // 尝试恢复之前选择的课程索引
    let finalSelectedLessonIndex = 0;
    let finalSelectedLessonFile = defaultLessonFile;

    // 如果 onLoad 时从缓存中恢复了 selectedLessonFile，且它不是当前词典的默认“全部课程”
    // 则尝试在新生成的 lessonsToShow 中找到它
    const cachedLessonFile = this.data.selectedLessonFile; // 这是 onLoad 时可能从缓存恢复的值

    if (cachedLessonFile && cachedLessonFile !== defaultLessonFile) {
      const lessonIndex = lessonsToShow.findIndex(lesson => lesson.file === cachedLessonFile);
      if (lessonIndex !== -1) {
        finalSelectedLessonIndex = lessonIndex;
        finalSelectedLessonFile = cachedLessonFile;
      }
    }

    this.setData({
      lessons: lessonsToShow,
      selectedLessonIndex: finalSelectedLessonIndex,
      selectedLessonFile: finalSelectedLessonFile
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

  // 保存筛选条件到本地存储
  saveFilterSettings() {
    const filterToSave = {
      selectedDictionaryIndex: this.data.selectedDictionaryIndex,
      selectedLessonFile: this.data.selectedLessonFile,
      selectedLessonIndex: this.data.selectedLessonIndex, //确保课程索引也被保存
      selectedDictionaryName: this.data.dictionaries[this.data.selectedDictionaryIndex].name,
      selectedLessonName: this.data.lessons[this.data.selectedLessonIndex] ? this.data.lessons[this.data.selectedLessonIndex].name : '未知课程',
      dictionaryId: this.data.dictionaries[this.data.selectedDictionaryIndex].id,
      basePath: this.data.dictionaries[this.data.selectedDictionaryIndex].base_path || '',
      quizMode: this.data.quizMode,
      selectedQuestionTypes: this.data.selectedQuestionTypes // 新增保存题型选择
    };
    wx.setStorageSync('quizFilter', filterToSave);
    console.log('Filter settings saved:', filterToSave);
  },

  // 完成选择并保存筛选条件的逻辑
  startQuiz() { 
    if (!this.data.selectedLessonFile) {
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