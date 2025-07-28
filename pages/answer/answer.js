// pages/answer/answer.js
const mistakeManager = require('../../utils/mistakeManager.js'); // 引入错题管理器
const filterManager = require('../../utils/filterManager.js'); // 引入筛选管理器
const quizService = require('../../utils/quiz.service.js'); // 引入答题服务
const { AnimationHelper, ParticleHelper } = require('../../utils/animation.js'); // 引入辅助模块
const imageManager = require('../../utils/imageManager.js'); // 引入图片管理器

Page({
  data: {
    // 根据Figma设计稿，一级页面主要是选项，不直接展示题目信息
    currentFilterDisplay: '', // 用于显示当前题库筛选范围
    currentTextbookName: '请选择教材', // 当前选择的课本名称
    currentTextbookImage: '/images/icons/card.svg', // 当前选择的课本图片，默认使用卡片图标
    showTextbookSelector: false, // 控制教材选择弹窗的显示
    pageLoaded: false, // 控制页面渐显动画
    mistakeCount: 0, // 错题数量显示（超过99显示∞）
    // 题型选择相关数据
    showQuestionTypePopup: false, // 控制题型选择弹窗的显示
    questionTypeOptions: [], // 题型选项列表
    selectedQuestionTypes: [], // 当前选择的题型
    
    // 词库选择相关数据
    dictionaries: [], // 词典列表
    selectedDictionaryIndex: 0, // 当前选择的词典索引
    showCourseSelector: false, // 控制课程选择弹窗的显示
    
    // 美味补给横幅图片
    bannerImage: 'https://free.picui.cn/free/2025/07/27/6885dd53087dd.png', // 默认大面包图片 ✨
  },
  onLoad: function (options) {
    // 页面加载时可以进行一些初始化操作
    console.log('Page loaded with options:', options);

    // 初始化动画辅助模块
    this.animationHelper = new AnimationHelper(this);
    this.particleHelper = new ParticleHelper(this);

    // 检查是否已选择教材
    const selectedDict = wx.getStorageSync('selectedDictionary');
    if (!selectedDict) {
      this.setData({ showTextbookSelector: true });
    }

    // 初始化题型选择数据
    this.initializeQuestionTypes();

    // 启动自动弹跳效果
    this.animationHelper.startAutoBounce();
    
    // 初始化粒子效果
    this.particleHelper.init();
  },

  /**
   * 初始化题型选择数据
   */
  initializeQuestionTypes() {
    const filterService = require('../../utils/filter.service.js');
    const questionTypeOptions = filterService.getDefaultQuestionTypeOptions();
    
    // 获取当前用户的选择
    const userFilter = filterManager.getFilter();
    const selectedQuestionTypes = userFilter && userFilter.selectedQuestionTypes 
      ? userFilter.selectedQuestionTypes 
      : filterService.getDefaultSelectedQuestionTypes();
    
    // 更新选项的选中状态
    const updatedOptions = questionTypeOptions.map(opt => ({
      ...opt,
      checked: selectedQuestionTypes.includes(opt.value)
    }));
    
    this.setData({
      questionTypeOptions: updatedOptions,
      selectedQuestionTypes: selectedQuestionTypes
    });
    
    console.log('题型选择数据已初始化:', { selectedQuestionTypes, updatedOptions });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('Page ready');
    // 页面渲染完成后，启动渐显动画
    setTimeout(() => {
      this.setData({ pageLoaded: true });
    }, 100); // 延迟100ms开始动画，确保页面完全渲染
  },

  /**
   * 处理元素触摸事件
   */
  handleElementTouch(e) {
    this.animationHelper.handleElementTouch(e);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('Page show');
    
    // 更新页面数据
    this.updatePageData();
    
    // 初始化或刷新粒子效果
    this.particleHelper.init();
    
    // 更新底部导航栏状态
    this.updateTabBarState();
  },

  /**
   * 更新页面所有动态数据
   * 包括筛选条件、教材信息、错题本数量等
   */
  updatePageData() {
    // 获取用户在filter页面的真实选择（包括course模式的选择）
    let userFilter = filterManager.getFilter();
    let currentFilterDisplay = '请选择教材和课程'; // 默认提示
    let currentTextbookName = '请选择教材'; // 默认课本名称
    let currentTextbookImage = '/images/icons/card.svg'; // 默认课本图片

    console.log('📋 当前筛选信息:', userFilter);

    // 优先处理用户的筛选选择（包括course模式）
    if (userFilter && (userFilter.selectedDictionaryName || userFilter.dictionaryId)) {
      console.log('📋 检测到用户筛选信息:', userFilter);
      
      // 获取教材名称 - 优先使用selectedDictionaryName，如果没有则从数据库查找
      if (userFilter.selectedDictionaryName) {
        currentTextbookName = userFilter.selectedDictionaryName;
      } else if (userFilter.dictionaryId) {
        const dictionaries = require('../../database/dictionaries.js').dictionaries;
        const selectedDict = dictionaries.find(d => d.id === userFilter.dictionaryId);
        currentTextbookName = selectedDict ? selectedDict.name : '未知教材';
      }
      
      // 获取教材图片 - 优先使用dictionaryId，如果没有则使用selectedDictionaryKey
      const imageId = userFilter.dictionaryId || userFilter.selectedDictionaryKey;
      if (imageId) {
        console.log('🔍 准备获取课本图片，imageId:', imageId);
        currentTextbookImage = this.getTextbookImage(imageId);
      }
      
      // 构建显示文本
      if (userFilter.selectedLessonName && userFilter.selectedLessonName !== '全部课程') {
        currentFilterDisplay = `当前：${currentTextbookName} - ${userFilter.selectedLessonName}`;
      } else {
        currentFilterDisplay = `当前：${currentTextbookName} - 全部课程`;
      }

      // 如果是course模式，确保显示具体的课程信息
      if (userFilter.quizMode === 'course' && userFilter.selectedLessonName) {
        console.log('🎯 检测到课程模式，显示具体课程信息');
        currentFilterDisplay = `当前：${currentTextbookName} - ${userFilter.selectedLessonName}`;
      }
      
      console.log('✅ 筛选信息处理完成:', {
        currentTextbookName,
        currentFilterDisplay,
        currentTextbookImage
      });
    } else {
      // 如果没有筛选条件，检查是否有旧的selectedDictionary
      const selectedDictId = wx.getStorageSync('selectedDictionary');
      console.log('🔍 从本地存储获取课本ID:', selectedDictId);
      if (selectedDictId) {
        const dictionaries = require('../../database/dictionaries.js').dictionaries;
        const selectedDict = dictionaries.find(d => d.id === selectedDictId);
        console.log('📚 找到的课本信息:', selectedDict);
        if (selectedDict) {
          currentTextbookName = selectedDict.name;
          console.log('🔍 准备获取课本图片，dictionaryId:', selectedDict.id);
          currentTextbookImage = this.getTextbookImage(selectedDict.id);
          currentFilterDisplay = `当前：${selectedDict.name} - 全部课程`;
        }
      } else {
        // 如果完全没有数据，设置默认的大家的日语
        console.log('🎯 没有找到任何教材数据，设置默认教材');
        const dictionaries = require('../../database/dictionaries.js').dictionaries;
        const defaultDict = dictionaries.find(d => d.id === 'everyones_japanese') || dictionaries[0];
        if (defaultDict) {
          currentTextbookName = defaultDict.name;
          currentTextbookImage = this.getTextbookImage(defaultDict.id);
          currentFilterDisplay = `当前：${defaultDict.name} - 全部课程`;
          
          // 保存默认选择到本地存储
          wx.setStorageSync('selectedDictionary', defaultDict.id);
          console.log('💾 已保存默认教材到本地存储:', defaultDict.id);
        }
      }
    }

    // 获取错题数量
    const mistakeCount = mistakeManager.getMistakeList().length;
    // 当错题数量超过99时显示∞符号
    const mistakeCountDisplay = mistakeCount > 99 ? '∞' : mistakeCount;

    console.log('🎯 最终设置的数据:', {
      currentFilterDisplay,
      currentTextbookName,
      currentTextbookImage,
      mistakeCount: mistakeCountDisplay
    });

    this.setData({
      currentFilterDisplay: currentFilterDisplay,
      currentTextbookName: currentTextbookName,
      currentTextbookImage: currentTextbookImage,
      mistakeCount: mistakeCountDisplay // 更新错题数量显示
    });

    // 获取当前选择的美味补给奖品横幅图片 🍞✨
    this.updateBannerImage();
  },

  /**
   * 更新底部导航栏状态
   */
  updateTabBarState() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const page = getCurrentPages().pop();
      const route = page.route;
      const tabList = this.getTabBar().data.tabList;
      const index = tabList.findIndex(item => item.pagePath.includes(route));
      if (index !== -1) {
        this.getTabBar().updateSelected(index);
      }
    }
  },



  /**
   * 根据课本ID获取对应的图片路径
   */
  getTextbookImage(dictionaryId) {
    // 动态从数据库获取课本信息
    try {
      console.log('🔍 获取课本图片，dictionaryId:', dictionaryId);
      
      if (!dictionaryId) {
        console.warn('⚠️ dictionaryId 为空，使用默认的大家的日语图片');
        // 当dictionaryId为空时，返回默认的大家的日语图片，而不是通用图标
        return 'https://free.picui.cn/free/2025/07/20/687bd47160e75.jpg';
      }
      
      const dictionariesData = require('../../database/dictionaries.js');
      console.log('📚 数据库加载成功，课本数量:', dictionariesData.dictionaries.length);
      
      const dictionary = dictionariesData.dictionaries.find(dict => dict.id === dictionaryId);
      console.log('🎯 找到的课本信息:', dictionary);
      
      if (dictionary && dictionary.cover_image) {
        console.log('✅ 使用数据库中的封面图片:', dictionary.cover_image);
        return dictionary.cover_image;
      }
      
      console.warn('⚠️ 数据库中没有找到图片，使用默认图片');
      // 如果数据库中没有图片字段，返回默认图片
      return 'https://free.picui.cn/free/2025/07/20/687bd47160e75.jpg';
    } catch (error) {
      console.error('❌ 获取课本图片失败:', error);
      // 即使出错也返回默认的大家的日语图片
      return 'https://free.picui.cn/free/2025/07/20/687bd47160e75.jpg';
    }
  },

  /**
   * 更新美味补给横幅图片 🍞✨
   * 根据陈列馆页面美味补给系列的选择，动态显示对应的横幅图片
   */
  async updateBannerImage() {
    try {
      console.log('🍞 开始更新美味补给横幅图片...');
      
      // 获取当前选择的美味补给奖品ID
      const supplyParticleId = wx.getStorageSync('supplyParticleId') || 'FOOD-DEFAULT-01';
      console.log('🎯 当前选择的美味补给奖品ID:', supplyParticleId);
      
      // 引入奖品配置数据
      const { PrizeDataManager } = require('../../data/gashapon-prizes-config.js');
      
      // 查找对应的奖品配置
      const prizeData = PrizeDataManager.getPrizeById(supplyParticleId);
      
      let bannerImageUrl = 'https://free.picui.cn/free/2025/07/27/6885dd53087dd.png'; // 默认北海道面包图片

      if (prizeData) {
        console.log('🏷️ 奖品名称:', prizeData.name);
        console.log('🖼️ 奖品横幅图片:', prizeData.bannerImage);
        
        // 如果奖品有横幅图片且不为空，使用奖品的横幅图片
        if (prizeData.bannerImage && prizeData.bannerImage.trim() !== '') {
          bannerImageUrl = prizeData.bannerImage; 
        }
      } else {
        console.warn('⚠️ 未找到对应的奖品配置，使用默认图片');
      }

      // 使用 imageManager 获取本地缓存路径
      const localBannerPath = await imageManager.getImagePath(bannerImageUrl);
      console.log('✅ 最终使用的横幅图片本地路径:', localBannerPath);

      // 更新横幅图片
      this.setData({
        bannerImage: localBannerPath
      });
      
      console.log('🎉 美味补给横幅图片更新成功！');

    } catch (error) {
      console.error('❌ 更新美味补给横幅图片失败:', error);
      // 出错时也尝试加载默认图片的缓存版本
      const defaultImagePath = await imageManager.getImagePath('https://free.picui.cn/free/2025/07/27/6885dd53087dd.png');
      this.setData({
        bannerImage: defaultImagePath
      });
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
        // 构建一个与 filter 页面保存的结构一致的筛选条件对象
        const defaultFilter = {
          selectedDictionaryIndex: allDictionaries.findIndex(d => d.id === defaultDictionaryId), // 直接使用词典索引
          selectedLessonFiles: [`DICTIONARY_${defaultDictionary.id}_ALL_LESSONS`],
          selectedLessonName: '全部课程',
          selectedDictionaryName: defaultDictionary.name,
          dictionaryId: defaultDictionary.id,
          basePath: defaultDictionary.base_path || '',
          selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill']
        };

        // 使用filterManager保存筛选条件
        filterManager.saveFilter(defaultFilter);
        wx.setStorageSync('selectedDictionary', defaultDictionary.id);

        // 更新UI显示
        this.setData({
          currentFilterDisplay: `当前：${defaultDictionary.name} - 全部课程`,
          currentTextbookName: defaultDictionary.name,
          currentTextbookImage: this.getTextbookImage(defaultDictionary.id)
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
    const dictionaryIndex = allDictionaries.findIndex(d => d.id === selectedDictionary.id);

    // 构建一个与 filter 页面保存的结构一致的筛选条件对象
    const userFilter = {
      selectedDictionaryIndex: dictionaryIndex !== -1 ? dictionaryIndex : 0,
      selectedLessonFiles: [`DICTIONARY_${selectedDictionary.id}_ALL_LESSONS`], // 默认选择该教材的全部课程
      selectedLessonName: '全部课程',
      selectedDictionaryName: selectedDictionary.name,
      dictionaryId: selectedDictionary.id,
      basePath: selectedDictionary.base_path || '',
      // 首次选择时，使用默认的题型
      selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill']
    };

    // 使用filterManager保存筛选条件
    filterManager.saveFilter(userFilter);
    // 为了兼容旧逻辑或其他地方可能的直接引用，也保存一份 selectedDictionary
    wx.setStorageSync('selectedDictionary', selectedDictionary.id);

    // 更新页面显示并关闭弹窗
    this.setData({
      showTextbookSelector: false,
      currentFilterDisplay: `当前：${selectedDictionary.name} - 全部课程`,
      currentTextbookName: selectedDictionary.name,
      currentTextbookImage: this.getTextbookImage(selectedDictionary.id)
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
    
    // 停止粒子刷新定时器，节省内存
    if (this.particleHelper) {
      this.particleHelper.destroy();
      console.log('⏸️ 页面隐藏，停止粒子刷新定时器');
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('Page unload');
    
    // 销毁动画助手，清理所有定时器
    if (this.animationHelper) {
      this.animationHelper.destroy();
    }

    // 销毁粒子助手，清理定时器
    if (this.particleHelper) {
      this.particleHelper.destroy();
    }
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
   * 跳转到题库筛选页面 -> 改为显示课程选择弹窗
   */
  navigateToFilter() {
    console.log('显示课程选择弹窗');
    this.showCourseSelector();
  },

  /**
   * 显示课程选择弹窗（现在简化为词库选择）
   */
  showCourseSelector() {
    const filterService = require('../../utils/filter.service.js');
    
    // 初始化词典列表，传递默认的options参数
    const dictionaries = filterService.initializeFilterState({ mode: 'quick' }).dictionaries;
    
    // 获取当前筛选条件
    const filterManager = require('../../utils/filterManager.js');
    const currentFilter = filterManager.getFilter() || {};
    
    // 找到当前选择的词典索引
    let selectedDictionaryIndex = 0;
    if (currentFilter.dictionaryId) {
      const foundIndex = dictionaries.findIndex(dict => dict.id === currentFilter.dictionaryId);
      if (foundIndex !== -1) {
        selectedDictionaryIndex = foundIndex;
      }
    }
    
    this.setData({
      dictionaries: dictionaries,
      selectedDictionaryIndex: selectedDictionaryIndex,
      showCourseSelector: true
    });
  },

  /**
   * 正方形按钮点击事件 - 显示题型选择弹窗
   */
  onSquareButtonTap() {
    console.log('Square button tapped - 显示题型选择弹窗');
    this.showQuestionTypePopup();
  },

  /**
   * 显示题型选择弹窗
   */
  showQuestionTypePopup() {
    // 如果数据还没有初始化，先初始化
    if (!this.data.questionTypeOptions || this.data.questionTypeOptions.length === 0) {
      this.initializeQuestionTypes();
    }
    
    // 显示弹窗
    this.setData({
      showQuestionTypePopup: true
    });
  },

  /**
   * 关闭题型选择弹窗
   */
  onCloseQuestionTypePopup() {
    this.setData({ showQuestionTypePopup: false });
  },

  /**
   * 确认题型选择
   */
  onConfirmQuestionTypePopup(e) {
    const { selectedQuestionTypes, questionTypeOptions } = e.detail;
    
    // 更新当前页面数据
    this.setData({
      selectedQuestionTypes,
      questionTypeOptions,
      showQuestionTypePopup: false
    });
    
    // 保存到筛选条件中
    const userFilter = filterManager.getFilter() || {};
    const updatedFilter = {
      ...userFilter,
      selectedQuestionTypes: selectedQuestionTypes
    };
    
    filterManager.saveFilter(updatedFilter);
    
    wx.showToast({
      title: '题型已更新',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 开始快速答题
   */
  async startQuickQuiz() {
    console.log('Start Quick Quiz');
    
    let userFilter = filterManager.getFilter();
    
    if (!userFilter || !userFilter.selectedLessonFiles || userFilter.selectedLessonFiles.length === 0) {
      wx.showToast({
        title: '请先选择题库范围',
        icon: 'none',
        duration: 1500
      });
      setTimeout(() => {
        this.showCourseSelector();
      }, 1000);
      return;
    }

    wx.showLoading({ title: '正在出题...' });

    try {
      const quizData = await quizService.initializeQuiz({ mode: 'quick' });
      wx.hideLoading();

      if (quizData.error) {
        wx.showToast({ title: quizData.error, icon: 'none' });
        return;
      }

      if (!quizData.questions || quizData.questions.length === 0) {
        wx.showToast({ title: '没有找到符合条件的题目', icon: 'none' });
        return;
      }
      
      this.navigateToQuizPage(quizData.questions, quizData.allWordsInLesson, userFilter, 'quick');
    } catch (error) {
      wx.hideLoading();
      console.error('Failed to start quick quiz:', error);
      wx.showToast({ title: '出题失败，请稍后重试', icon: 'none' });
    }
  },

  /**
   * 跳转到答题页
   */
  navigateToQuizPage(questions, words, filter, mode) {
    // 将题目数据和单词统计数据转换为JSON字符串，以便通过URL传递
    const questionsStr = JSON.stringify(questions);
    const wordsStr = JSON.stringify(words);
    const filterStr = JSON.stringify(filter);

    // 跳转到quiz页面，并通过URL参数传递数据
    wx.navigateTo({
      url: `/pages/quiz/quiz?questions=${encodeURIComponent(questionsStr)}&words=${encodeURIComponent(wordsStr)}&filter=${encodeURIComponent(filterStr)}&mode=${mode}`
    });
  },

  /**
   * 标准模式答题
   */
  navigateToStandardQuiz() {
    const filterManager = require('../../utils/filterManager.js');
    const currentFilter = filterManager.getFilter();
    
    // 如果没有选择词库，提示用户选择
    if (!currentFilter || !currentFilter.dictionaryId) {
      wx.showToast({
        title: '请先选择词库',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 确保使用全部课程
    const updatedFilter = {
      ...currentFilter,
      selectedLessonFiles: [`DICTIONARY_${currentFilter.dictionaryId}_ALL_LESSONS`]
    };
    filterManager.saveFilter(updatedFilter);
    
    wx.navigateTo({
      url: '/pages/quiz/quiz'
    });
  },

  /**
   * 错题重练
   */
  practiceWrongQuestions() {
    console.log('Practice Wrong Questions');
    wx.navigateTo({
      url: '/pages/mistakes/mistakes'
    });
  },

  /**
   * 开始时间线模式
   */
  startTimelineMode() {
    console.log('Start Timeline Mode');
    // 跳转到时间线页面
    wx.navigateTo({
      url: '/pages/course-mode/course-mode'
    });
  },

  /**
   * 面包点击事件 - 触发Q弹动画
   */
  onBreadTap: function() {
    this.animationHelper.triggerManualBounce();
  },

  // ========== 词库选择弹窗相关方法 ==========

  /**
   * 关闭词库选择弹窗
   */
  onCloseCourseSelector() {
    this.setData({ showCourseSelector: false });
  },

  /**
   * 处理词库选择变化
   */
  onCourseDictionaryChange(e) {
    const { selectedDictionaryIndex } = e.detail;
    this.setData({ selectedDictionaryIndex });
  },

  /**
   * 确认词库选择
   */
  onCourseSelectorConfirm() {
    const selectedDict = this.data.dictionaries[this.data.selectedDictionaryIndex];
    const filterManager = require('../../utils/filterManager.js');
    
    // 保存筛选设置（简化版，只保存词库信息）
    const filterToSave = {
      dictionaryId: selectedDict.id,
      selectedDictionaryIndex: this.data.selectedDictionaryIndex,
      selectedLessonFiles: [`DICTIONARY_${selectedDict.id}_ALL_LESSONS`], // 默认选择全部课程
      selectedQuestionTypes: this.data.selectedQuestionTypes || []
    };
    
    filterManager.saveFilter(filterToSave);
    
    // 更新主页面显示
    this.setData({
      showCourseSelector: false,
      currentFilterDisplay: `当前：${selectedDict.name} - 全部课程`,
      currentTextbookName: selectedDict.name,
      currentTextbookImage: this.getTextbookImage(selectedDict.id)
    });
    
    wx.showToast({
      title: '词库选择已保存',
      icon: 'success',
      duration: 1500
    });
  }
})
