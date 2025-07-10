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
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log('=== Card Study 页面初始化 ===');
    console.log('启动参数:', options);
    
    // 调试：检查当前筛选条件
    const currentFilter = require('../../utils/filterManager.js').getFilter();
    console.log('当前筛选条件:', currentFilter);
    
    // 使用quiz服务初始化数据（复用相同的筛选逻辑）
    const initialState = quizService.initializeQuiz(options);
    
    console.log('Quiz服务初始化结果:', initialState);
    console.log('生成的题目数量:', initialState.questions?.length || 0);
    console.log('原始单词数量:', initialState.allWordsInLesson?.length || 0);
    
    if (!initialState.questions || initialState.questions.length === 0) {
      console.error('没有获取到单词数据，显示错误提示');
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
    
    // 从questions中提取单词数据
    const allWords = initialState.questions.map(q => q.wordInfo);
    
    this.setData({
      lessonFiles: initialState.lessonFiles,
      dictionaryId: initialState.dictionaryId,
      basePath: initialState.basePath,
      allWords: allWords,
      totalWords: allWords.length,
      currentFilterDisplay: initialState.currentFilterDisplay,
      currentCard: allWords[0] || null,
      nextCard: allWords[1] || null,
      isLoading: false
    });
    
    this.startTimer();
    this.triggerLoadAnimation();
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
    
    this.setData({
      cardOffsetX: deltaX,
      cardOffsetY: limitedDeltaY,
      cardRotation: rotation,
      cardTransform: `translateX(${deltaX}px) translateY(${limitedDeltaY}px) rotate(${rotation}deg)`
    });
  },

  /**
   * 触摸结束事件
   */
  onTouchEnd: function(e) {
    if (this.data.isCardAnimating) return;
    
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
    this.setData({ isCardAnimating: true });
    
    const finalX = direction === 'right' ? 400 : -400;
    const finalRotation = direction === 'right' ? 30 : -30;
    
    // 执行滑出动画
    this.setData({
      cardTransform: `translateX(${finalX}px) translateY(${this.data.cardOffsetY}px) rotate(${finalRotation}deg)`
    });
    
    // 记录学习结果
    const isRemembered = direction === 'right';
    this.recordStudyResult(isRemembered);
    
    // 延迟切换到下一张卡片
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
      cardRotation: 0
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
    
    this.setData({
      currentWordIndex: nextIndex,
      currentCard: this.data.allWords[nextIndex],
      nextCard: this.data.allWords[nextIndex + 1] || null,
      isCardAnimating: false,
      cardTransform: 'translateX(0px) translateY(0px) rotate(0deg)',
      cardOffsetX: 0,
      cardOffsetY: 0,
      cardRotation: 0
    });
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
      url: `/pages/quiz-result/quiz-result?score=${rememberedCount}&totalQuestions=${studiedCount}&timeSpent=${timeSpent}&accuracy=${accuracy.toFixed(2)}&resultLevel=${resultLevel}&studyMode=card`
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