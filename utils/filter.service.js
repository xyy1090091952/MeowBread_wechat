/**
 * @file 筛选页面服务层 (业务逻辑处理器)
 * @description 
 *   职责：处理筛选页面的所有业务逻辑，如状态初始化、课程列表更新、选项联动等。
 *   特点：调用 Manager 层进行数据持久化，但不直接操作缓存。
 *   比喻：像是应用的“店长”，负责处理所有业务流程和决策。
 */
const dictionariesData = require('../database/dictionaries.js');
const filterManager = require('./filterManager.js');

const service = {
  // 初始化筛选器状态
  initializeFilterState(options = {}) {
    const savedFilter = filterManager.getFilter();
    // 优先读取用户的原始选择，如果当前是course模式的话
    const originalUserFilter = wx.getStorageSync('originalUserFilter');
    const userFilter = (savedFilter && savedFilter.quizMode === 'course' && originalUserFilter) ? originalUserFilter : savedFilter;
    
    let state = {
      dictionaries: dictionariesData.dictionaries,
      selectedDictionaryIndex: 0,
      selectedLessonFiles: [],
      quizMode: options.mode || 'quick',
      questionTypeOptions: this.getDefaultQuestionTypeOptions(),
      selectedQuestionTypes: [],
      lessons: [],
    };

    if (userFilter) {
      state.selectedDictionaryIndex = userFilter.selectedDictionaryIndex !== undefined ? userFilter.selectedDictionaryIndex : 0;
      state.selectedLessonFiles = userFilter.selectedLessonFiles || [];
      state.quizMode = userFilter.quizMode || options.mode || 'quick';
      state.selectedQuestionTypes = userFilter.selectedQuestionTypes || this.getDefaultSelectedQuestionTypes();
    } else {
      state.selectedQuestionTypes = this.getDefaultSelectedQuestionTypes();
    }

    state.questionTypeOptions = state.questionTypeOptions.map(opt => ({
      ...opt,
      checked: state.selectedQuestionTypes.includes(opt.value)
    }));

    state.lessons = this.getLessonsForDictionary(state.dictionaries[state.selectedDictionaryIndex], state.selectedLessonFiles);

    return state;
  },

  // 获取默认题型选项
  getDefaultQuestionTypeOptions() {
    return [
      { name: '根据中文意思选日语', value: 'zh_to_jp_choice', checked: true, category: '选择题' },
      { name: '根据日语选中文', value: 'jp_to_zh_choice', checked: true, category: '选择题' },
      { name: '根据中文意思写日语', value: 'zh_to_jp_fill', checked: true, category: '填空题' },
      { name: '根据日文汉字写假名', value: 'jp_kanji_to_kana_fill', checked: true, category: '填空题' }
    ];
  },

  // 获取默认选中的题型
  getDefaultSelectedQuestionTypes() {
    return this.getDefaultQuestionTypeOptions().map(opt => opt.value);
  },

  // 根据词典获取课程列表
  getLessonsForDictionary(dictionary, selectedLessonFiles = []) {
    const allLessonsOption = {
      name: '全部课程',
      file: `DICTIONARY_${dictionary.id}_ALL_LESSONS`,
      checked: false
    };

    let lessonsToShow = [allLessonsOption];
    if (dictionary.courses && Array.isArray(dictionary.courses)) {
      dictionary.courses.forEach(course => {
        // 现在数据结构已统一：courseTitle为"第X课"，description为课程名字
        // 显示格式：courseTitle + description（如果description存在）
        const name = course.description 
          ? `${course.courseTitle} ${course.description}`
          : course.courseTitle;

        lessonsToShow.push({
          name: name,
          file: course.lessonFile.startsWith('http') ? course.lessonFile : `${dictionary.id}_${course.lessonFile}`,
          checked: false
        });
      });
    }

    return this.updateLessonSelection(lessonsToShow, selectedLessonFiles);
  },

  // 更新课程的选中状态
  updateLessonSelection(lessons, selectedFiles) {
    const allLessonsOption = lessons.find(l => l.file.includes('_ALL_LESSONS'));
    if (!allLessonsOption) return lessons.map(l => ({...l, checked: selectedFiles.includes(l.file) }));

    const isAllLessonsSelected = selectedFiles.includes(allLessonsOption.file);

    if (isAllLessonsSelected) {
      return lessons.map(l => ({ ...l, checked: true }));
    }

    let allIndividualLessonsChecked = lessons.length > 1;
    const updatedLessons = lessons.map(lesson => {
      if (lesson.file !== allLessonsOption.file) {
        const isChecked = selectedFiles.includes(lesson.file);
        if (!isChecked) allIndividualLessonsChecked = false;
        return { ...lesson, checked: isChecked };
      }
      return lesson; // 返回未修改的“全部课程”选项
    });

    allLessonsOption.checked = allIndividualLessonsChecked;
    // 在返回的数组中也更新“全部课程”的状态
    const finalLessons = updatedLessons.map(l => l.file === allLessonsOption.file ? { ...l, checked: allIndividualLessonsChecked } : l);

    return finalLessons;
  },

  // 处理课程复选框变化
  handleLessonCheckboxChange(lessons, clickedFile) {
    let currentLessons = JSON.parse(JSON.stringify(lessons));
    let selectedFiles = [];

    const allLessonsOption = currentLessons.find(l => l.file.includes('_ALL_LESSONS'));
    const isAllLessonsOptionClick = clickedFile === allLessonsOption.file;

    if (isAllLessonsOptionClick) {
      const shouldSelectAll = !allLessonsOption.checked;
      currentLessons.forEach(lesson => lesson.checked = shouldSelectAll);
      if (shouldSelectAll) {
        selectedFiles = [allLessonsOption.file];
      } else {
        selectedFiles = [];
      }
    } else {
      const clickedLesson = currentLessons.find(l => l.file === clickedFile);
      if (clickedLesson) {
        clickedLesson.checked = !clickedLesson.checked;
      }

      const allOtherLessonsChecked = currentLessons.filter(l => !l.file.includes('_ALL_LESSONS')).every(l => l.checked);
      if (allLessonsOption) {
        allLessonsOption.checked = allOtherLessonsChecked;
      }

      if (allOtherLessonsChecked) {
        selectedFiles = [allLessonsOption.file];
      } else {
        selectedFiles = currentLessons.filter(l => l.checked && !l.file.includes('_ALL_LESSONS')).map(l => l.file);
      }
    }

    return { lessons: currentLessons, selectedLessonFiles: selectedFiles };
  },

  // 保存筛选设置
  saveFilterSettings(data) {
    const selectedDict = data.dictionaries[data.selectedDictionaryIndex];
    let lessonName = '请选择课程';
    const selectedCount = data.selectedLessonFiles.filter(file => !file.includes('_ALL_LESSONS')).length;
    const allLessonsFile = `DICTIONARY_${selectedDict.id}_ALL_LESSONS`;

    if (data.selectedLessonFiles.includes(allLessonsFile)) {
      lessonName = '全部课程';
    } else if (selectedCount > 0) {
      lessonName = `${selectedCount}个课程`;
    }

    const filterToSave = {
      selectedDictionaryIndex: data.selectedDictionaryIndex,
      selectedLessonFiles: data.selectedLessonFiles,
      selectedDictionaryName: selectedDict.name,
      selectedLessonName: lessonName,
      selectedDictionaryKey: selectedDict.id, // 添加这个字段用于course-mode识别
      dictionaryId: selectedDict.id,
      basePath: selectedDict.base_path || '',
      quizMode: data.quizMode,
      selectedQuestionTypes: data.selectedQuestionTypes
    };
    filterManager.saveFilter(filterToSave);
    
    // 同时保存用户的原始选择，用于answer页面显示
    wx.setStorageSync('originalUserFilter', filterToSave);
    
    // 确保selectedDictionary也被正确保存，用于vocabulary页面排序
    if (selectedDict.id !== 'all') {
      wx.setStorageSync('selectedDictionary', selectedDict.id);
      console.log('已保存用户选择的课本ID到selectedDictionary:', selectedDict.id);
    }
    
    console.log('Filter settings saved:', filterToSave);
  }
};

module.exports = service;