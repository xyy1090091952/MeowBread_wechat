// pages/card-study/card-study.js
/**
 * @file 卡片式学习页面核心逻辑
 * @author MeowBread Team
 */
const quizService = require('../../utils/quiz.service.js');
const mistakeManager = require('../../utils/mistakeManager.js');
const learnedManager = require('../../utils/learnedManager.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 基础数据
    lessonFiles: [], // 课程范围标识 (数组)
    dictionaryId: '', // 当前词典ID ('all' 或具体ID)
    basePath: '', // 当前词典的基础路径 (如果非'all')
    allWords: [], // 当前范围的所有单词
    currentWordIndex: 0, // 当前单词索引
    
    // 学习统计
    studiedCount: 0, // 已学习的单词数
    rememberedCount: 0, // 记住的单词数
    forgottenCount: 0, // 忘记的单词数
    totalWords: 0, // 总单词数
    
    // 计时器
    timeSpent: 0, // 用时
    formattedTime: '00:00', // 格式化后的时间
    timer: null, // 计时器
    
    // UI状态
    isLoading: true, // 加载状态
    pageLoaded: false, // 控制页面加载动画
    currentFilterDisplay: '', // 当前筛选条件显示
    
    // 卡片滑动状态
    cardTransform: '', // 卡片变换样式
    isCardAnimating: false, // 卡片是否正在动画中
    touchStartX: 0, // 触摸开始X坐标
    touchStartY: 0, // 触摸开始Y坐标
    cardOffsetX: 0, // 卡片X偏移量
    cardOffsetY: 0, // 卡片Y偏移量
    cardRotation: 0, // 卡片旋转角度
    
    // 卡片显示数据
    currentCard: null, // 当前显示的卡片数据
    nextCard: null, // 下一张卡片数据
    currentCardStyleType: 1, // 当前卡片样式类型 (1-6循环)
    nextCardStyleType: 2, // 下一张卡片样式类型 (1-6循环)
    currentCardImageUrl: '', // 当前卡片背景图片链接
    nextCardImageUrl: '', // 下一张卡片背景图片链接
    isTransitioning: false, // 是否正在进行卡片过渡动画
    isNewCardEntering: false, // 新背景卡片是否正在入场
    
    // 背景卡片动画状态
    backgroundCardTransform: 'rotate(-8deg) scale(0.9)', // 背景卡片的变换
    backgroundCardOpacity: 0, // 背景卡片的透明度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    console.log('=== Card Study 页面初始化 ===');
    console.log('启动参数:', options);
    
    // 直接从filterManager获取当前有效的筛选条件来加载单词
    // 不再调用quizService.initializeQuiz，因为它会错误地保存临时状态
    const filterManager = require('../../utils/filterManager.js');
    const wordManager = require('../../utils/wordManager.js');
    const currentFilter = filterManager.getFilter();
    // 从 wordManager 获取单词数据
    const rawWords = await wordManager.getWordsByFilter(currentFilter);

    // [FIX] 数据结构转换：将 wordManager 返回的嵌套对象扁平化
    // 原始结构: { data: { word_details... }, sourceDictionary: '...', lesson: '...' }
    // 目标结构: { word_details..., sourceDictionary: '...', lesson: '...' }
    const allWords = rawWords.map(wordInfo => ({
      ...wordInfo.data,
      sourceDictionary: wordInfo.sourceDictionary,
      lesson: wordInfo.lesson
    }));

    // 检查是否成功获取到单词
    if (!allWords || allWords.length === 0) {
      console.error('card-study: 未根据当前筛选条件找到任何单词。');
      wx.showModal({
        title: '提示',
        content: '根据当前筛选条件，没有可学习的单词。请尝试更改筛选设置。',
        showCancel: false,
        confirmText: '返回',
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    // 卡片学习模式不需要复杂的 "问题" 结构，直接使用单词数据
    // 也不再需要 initialState 和多余的日志
    const currentStyleType = this.calculateCardStyleType(0);
    const nextStyleType = this.calculateCardStyleType(1);
    
    this.setData({
      lessonFiles: currentFilter.selectedLessonFiles,
      dictionaryId: currentFilter.dictionaryId,
      allWords: allWords,
      totalWords: allWords.length,
      // 为了简化，我们暂时移除 filter display 的复杂逻辑
      currentFilterDisplay: ``, 
      currentCard: allWords[0] || null,
      nextCard: allWords[1] || null,
      currentCardStyleType: currentStyleType,
      nextCardStyleType: nextStyleType,
      currentCardImageUrl: this.getCardImageUrl(currentStyleType),
      nextCardImageUrl: this.getCardImageUrl(nextStyleType),
      isLoading: false
    });
    
    this.startTimer();
    this.triggerLoadAnimation();
  },

  /**
   * 计算卡片样式类型 (1-6循环)
   * @param {number} index - 卡片索引
   * @returns {number} 样式类型 (1-6)
   */
  calculateCardStyleType: function(index) {
    return (index % 6) + 1;
  },

  /**
   * 获取卡片背景图片的云端链接
   * @param {number} styleType - 卡片样式类型 (1-6)
   * @returns {string} 云端图片链接
   */
  getCardImageUrl: function(styleType) {
    const cardImageUrls = {
      1: 'https://free.picui.cn/free/2025/07/20/687bd36a16e2b.jpg',
      2: 'https://free.picui.cn/free/2025/07/20/687bd36a6ae61.jpg',
      3: 'https://free.picui.cn/free/2025/07/20/687bd36b17b24.jpg',
      4: 'https://free.picui.cn/free/2025/07/20/687bd369ca8a1.jpg',
      5: 'https://free.picui.cn/free/2025/07/20/687bd36b8b0c7.jpg',
      6: 'https://free.picui.cn/free/2025/07/20/687bd36cedd17.jpg'
    };
    return cardImageUrls[styleType] || cardImageUrls[1]; // 默认返回第一张图片
  },

  /**
   * 触发加载动画
   */
  triggerLoadAnimation: function() {
    this.setData({ pageLoaded: false });
    setTimeout(() => {
      this.setData({ pageLoaded: true });
    }, 100);
  },

  /**
   * 开始计时器
   */
  startTimer: function() {
    this.clearTimer();
    const timer = setInterval(() => {
      const newTimeSpent = this.data.timeSpent + 1;
      this.setData({
        timeSpent: newTimeSpent,
        formattedTime: this.formatTime(newTimeSpent)
      });
    }, 1000);
    this.setData({ timer: timer });
  },

  /**
   * 清除计时器
   */
  clearTimer: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  /**
   * 格式化时间
   */
  formatTime: function(seconds) {
    return quizService.formatTime(seconds);
  },

  /**
   * 触摸开始事件
   */
  onTouchStart: function(e) {
    if (this.data.isCardAnimating) return;
    
    const touch = e.touches[0];
    this.setData({
      touchStartX: touch.clientX,
      touchStartY: touch.clientY
    });
  },

  /**
   * 触摸移动事件
   */
  onTouchMove: function(e) {
    if (this.data.isCardAnimating) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.data.touchStartX;
    const deltaY = touch.clientY - this.data.touchStartY;
    
    // 限制垂直移动
    const limitedDeltaY = Math.max(-50, Math.min(50, deltaY));
    
    // 计算旋转角度（基于水平移动）
    const rotation = deltaX * 0.1; // 旋转系数
    
    // 计算背景卡片的过渡进度（基于滑动距离）
    const threshold = 100; // 滑动阈值
    const progress = Math.min(Math.abs(deltaX) / threshold, 1); // 0-1之间的进度值
    
    // 计算背景卡片的状态
    const backgroundRotation = -8 + (8 * progress); // 从-8deg过渡到0deg（完全正常状态）
    const backgroundOpacity = 0 + (1 * progress); // 从0过渡到1
    const backgroundScale = 0.9 + (0.1 * progress); // 从0.9过渡到1
    
    this.setData({
      cardOffsetX: deltaX,
      cardOffsetY: limitedDeltaY,
      cardRotation: rotation,
      cardTransform: `translateX(${deltaX}px) translateY(${limitedDeltaY}px) rotate(${rotation}deg)`,
      // 背景卡片的实时状态
      backgroundCardTransform: `rotate(${backgroundRotation}deg) scale(${backgroundScale})`,
      backgroundCardOpacity: backgroundOpacity
    });
  },

  /**
   * 触摸结束事件
   */
  onTouchEnd: function(e) {
    if (this.data.isCardAnimating) return;
    
    // 设置动画状态，防止重复触发
    this.setData({ isCardAnimating: true });
    
    const deltaX = this.data.cardOffsetX;
    const threshold = 100; // 滑动阈值
    
    if (Math.abs(deltaX) > threshold) {
      // 滑动距离足够，执行卡片移除动画
      this.swipeCard(deltaX > 0 ? 'right' : 'left');
    } else {
      // 滑动距离不够，回弹
      this.resetCard();
    }
  },

  /**
   * 卡片滑动处理
   */
  swipeCard: function(direction) {
    const finalX = direction === 'right' ? 400 : -400;
    const finalRotation = direction === 'right' ? 30 : -30;
    
    // 执行滑出动画，背景卡片保持当前状态（已经在滑动过程中完成过渡）
    this.setData({
      cardTransform: `translateX(${finalX}px) translateY(${this.data.cardOffsetY}px) rotate(${finalRotation}deg)`
      // 背景卡片不需要额外设置，已经在滑动过程中到达最终状态
    });
    
    // 记录学习结果
    const isRemembered = direction === 'right';
    this.recordStudyResult(isRemembered);
    
    // 延迟切换到下一张卡片（时间缩短）
    setTimeout(() => {
      this.nextCard();
    }, 300);
  },

  /**
   * 重置卡片位置
   */
  resetCard: function() {
    this.setData({
      cardTransform: 'translateX(0px) translateY(0px) rotate(0deg)',
      cardOffsetX: 0,
      cardOffsetY: 0,
      cardRotation: 0,
      isCardAnimating: false,
      // 重置背景卡片到初始状态
      backgroundCardTransform: 'rotate(-8deg) scale(0.9)',
      backgroundCardOpacity: 0
    });
  },

  /**
   * 记录学习结果
   */
  recordStudyResult: function(isRemembered) {
    const currentWord = this.data.currentCard;
    if (!currentWord) return;
    
    const newStudiedCount = this.data.studiedCount + 1;
    let newRememberedCount = this.data.rememberedCount;
    let newForgottenCount = this.data.forgottenCount;
    
    if (isRemembered) {
      newRememberedCount++;
      // 标记为已学习
      this.markWordAsLearned(currentWord);
      // 从错题库中移除（如果存在）
      mistakeManager.correctMistake(currentWord);
    } else {
      newForgottenCount++;
      // 添加到错题库
      mistakeManager.addMistake(currentWord);
    }
    
    this.setData({
      studiedCount: newStudiedCount,
      rememberedCount: newRememberedCount,
      forgottenCount: newForgottenCount
    });
  },

  /**
   * 标记单词为已学习
   */
  markWordAsLearned: function(wordInfo) {
    try {
      let dictionaryId = this.data.dictionaryId;
      
      if (dictionaryId === 'all' && wordInfo.sourceDictionary) {
        dictionaryId = wordInfo.sourceDictionary;
      }
      
      if (!dictionaryId || dictionaryId === 'all') {
        console.warn('无法确定单词所属词典，将使用默认词典标记:', wordInfo);
        dictionaryId = 'everyones_japanese';
      }
      
      const success = learnedManager.markWordAsLearned(wordInfo, dictionaryId);
      
      if (success) {
        console.log(`单词已标记为已学习: ${wordInfo['假名'] || wordInfo['汉字']} (${dictionaryId})`);
      }
    } catch (error) {
      console.error('标记单词为已学习时出错:', error);
    }
  },

  /**
   * 下一张卡片
   */
  nextCard: function() {
    const nextIndex = this.data.currentWordIndex + 1;
    
    if (nextIndex >= this.data.totalWords) {
      // 学习完成
      this.finishStudy();
      return;
    }
    
    // 计算新的样式类型和图片链接
    const newNextStyleType = this.calculateCardStyleType(nextIndex + 1);
    
    // 直接切换到下一张卡片，背景卡片已经在滑动过程中完成了过渡
    this.setData({
      currentWordIndex: nextIndex,
      currentCard: this.data.nextCard, // 直接使用已经加载的nextCard
      currentCardStyleType: this.data.nextCardStyleType, // 使用已经计算好的样式类型
      currentCardImageUrl: this.data.nextCardImageUrl, // 使用已经计算好的图片链接
      nextCard: this.data.allWords[nextIndex + 1] || null, // 加载新的背景卡片
      nextCardStyleType: newNextStyleType,
      nextCardImageUrl: this.getCardImageUrl(newNextStyleType),
      isCardAnimating: false,
      cardTransform: 'translateX(0px) translateY(0px) rotate(0deg)',
      cardOffsetX: 0,
      cardOffsetY: 0,
      cardRotation: 0,
      // 重置背景卡片到初始状态
      backgroundCardTransform: 'rotate(-8deg) scale(0.9)',
      backgroundCardOpacity: 0
    });

    // 延迟显示新的背景卡片，产生出现动画效果
    if (this.data.allWords[nextIndex + 1]) {
      setTimeout(() => {
        this.setData({
          backgroundCardOpacity: 1
        });
      }, 100); // 100ms后显示背景卡片
    }
  },

  /**
   * 完成学习
   */
  finishStudy: function() {
    this.clearTimer();
    
    const { studiedCount, rememberedCount, timeSpent } = this.data;
    const accuracy = studiedCount > 0 ? (rememberedCount / studiedCount) : 0;
    
    let resultLevel = '';
    if (accuracy <= 0.2) resultLevel = 'noob';
    else if (accuracy <= 0.8) resultLevel = 'normal';
    else resultLevel = 'perfect';
    
    console.log(`卡片学习完成: 学习${studiedCount}个单词，记住${rememberedCount}个，准确率${(accuracy * 100).toFixed(1)}%`);
    
    wx.redirectTo({
      url: `/pages/quiz-result/quiz-result?score=${rememberedCount}&totalQuestions=${studiedCount}&timeSpent=${timeSpent}&accuracy=${accuracy.toFixed(2)}&resultLevel=${resultLevel}&studyMode=card&from=course`
    });
  },

  /**
   * 按钮点击 - 记住了
   */
  onRememberClick: function() {
    this.swipeCard('right');
  },

  /**
   * 按钮点击 - 没记住
   */
  onForgetClick: function() {
    this.swipeCard('left');
  },

  /**
   * 退出复习模式
   */
  onExitStudy: function() {
    // 清理计时器
    this.clearTimer();
    
    // 返回上一页
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 生命周期函数
   */
  onShow: function() {
    if (!this.data.timer && this.data.allWords.length > 0) {
      this.startTimer();
    }
  },

  onHide: function() {
    this.clearTimer();
  },

  onUnload: function() {
    this.clearTimer();
  }
});