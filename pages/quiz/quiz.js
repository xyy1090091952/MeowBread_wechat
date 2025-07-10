// pages/quiz/quiz.js
/**
 * @file 答题页面核心逻辑
 * @author MeowBread Team
 */
const quizService = require('../../utils/quiz.service.js');
const mistakeManager = require('../../utils/mistakeManager.js');
const learnedManager = require('../../utils/learnedManager.js');
const coinManager = require('../../utils/coinManager.js'); // 引入金币管理器

Page({
  /**
   * 页面的初始数据
   */
  data: {
    quizMode: '', // 答题模式: quick 或 endless
    lessonFiles: [], // 课程范围标识 (数组)
    dictionaryId: '', // 当前词典ID ('all' 或具体ID)
    basePath: '', // 当前词典的基础路径 (如果非'all')
    allWordsInLesson: [], // 当前范围的所有单词
    questions: [], // 题目列表
    currentQuestionIndex: 0, // 当前题目索引
    userAnswer: '', // 用户答案
    isUserAnswerEmpty: true, // 用户答案是否为空 (用于填空题按钮状态)
    selectedOption: null, // 用户选择的选项 (针对选择题)
    showAnswerCard: false, // 是否显示答案卡片
    isCorrect: false, // 当前答案是否正确
    score: 0, // 得分
    totalQuestions: 0, // 总题数 (快速答题模式)
    actualAnsweredQuestions: 0, // 实际回答的题目数（不包括跳过的题目）
    coinsEarned: 0, // 本次答题获得的金币数
    timeSpent: 0, // 用时
    formattedTime: '00:00', // 格式化后的时间
    timer: null, // 计时器
    isLoading: true, // 加载状态
    showQuestion: true, // 用于控制题目显示/隐藏以触发动画
    highlightParticles: true, // 新增：是否高亮助词
    processedExampleSentence: '', // 新增：处理后的例句
    pageLoaded: false // 控制页面加载动画
  },

  /**
   * 生命周期函数--监听页面加载
   */
    /**
   * 生命周期函数--监听页面加载
   * @param {object} options - 页面启动参数，包含 mode, from, words 等
   */
  onLoad: function(options) {
    const initialState = quizService.initializeQuiz(options);

    if (!initialState.questions || initialState.questions.length === 0) {
      wx.showModal({
        title: '提示',
        content: '根据当前筛选条件，没有可生成的题目。请尝试更改筛选设置。',
        showCancel: false,
        confirmText: '返回',
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    this.setData({
      ...initialState,
      score: 0,
      currentQuestionIndex: 0,
      actualAnsweredQuestions: 0, // 初始化实际回答题数
      userAnswer: '',
      isUserAnswerEmpty: true,
      selectedOption: null,
      showAnswerCard: false,
      isCorrect: false,
      timeSpent: 0,
      formattedTime: '00:00',
    });

    this.startTimer();
    
    // 触发加载动画
    this.triggerLoadAnimation();
  },

  // 触发加载动画
  triggerLoadAnimation: function() {
    // 重置动画状态
    this.setData({
      pageLoaded: false
    });
    
    // 延迟触发动画，确保页面渲染完成
    setTimeout(() => {
      this.setData({
        pageLoaded: true
      });
    }, 100);
  },

  // 新增：切换助词高亮状态
  toggleHighlight: function() {
    const newState = !this.data.highlightParticles;
    this.setData({ highlightParticles: newState });
    if (this.data.showAnswerCard) {
      this.processHighlight(); // 如果答案卡已显示，立即处理高亮
    }
  },

  // 处理例句中的助词高亮
  processHighlight: function() {
    const currentQuestion = this.data.questions[this.data.currentQuestionIndex];
    const originalSentence = currentQuestion?.wordInfo?.['例句'] || '';
    const processedSentence = quizService.getHighlightedSentence(originalSentence, this.data.highlightParticles);
    this.setData({ processedExampleSentence: processedSentence });
  },







  handleAnswerInput: function(e) {
    const userAnswer = e.detail.value;
    this.setData({
      userAnswer: userAnswer,
      isUserAnswerEmpty: userAnswer.trim() === ''
    });
  },

  // 输入框确认按钮事件处理
  onInputConfirm: function(e) {
    // 如果用户答案不为空且未显示答案卡，则提交答案
    if (!this.data.isUserAnswerEmpty && !this.data.showAnswerCard) {
      this.submitAnswer();
    }
  },

  onOptionSelect: function(e) {
    const selected = e.currentTarget.dataset.option;
    this.setData({ 
      userAnswer: selected,
      selectedOption: selected
    });
  },

    /**
   * 提交答案，进行对错判断，并更新UI和数据
   */
  submitAnswer: function() {
    const currentQ = this.data.questions[this.data.currentQuestionIndex];
    const isCorrect = quizService.checkAnswer(currentQ, this.data.userAnswer);

    // 只有提交答案才算实际回答了题目（跳过不算）
    const newAnsweredCount = this.data.actualAnsweredQuestions + 1;

    if (isCorrect) {
      // 答对了：更新错题记录 + 标记为已背
      mistakeManager.correctMistake(currentQ.wordInfo);
      
      // 标记单词为已背（需要获取词典ID）
      this.markWordAsLearned(currentQ.wordInfo);
      
      // 回答正确，增加1个金币
      coinManager.addCoins(1);
    } else {
      // 答错了：添加到错题库
      mistakeManager.addMistake(currentQ.wordInfo);
    }

    this.setData({
      isCorrect: isCorrect,
      showAnswerCard: true,
      score: this.data.score + (isCorrect ? 1 : 0),
      coinsEarned: this.data.coinsEarned + (isCorrect ? 1 : 0), // 如果正确，金币+1
      actualAnsweredQuestions: newAnsweredCount // 更新实际回答题数
    }, () => {
      // 在setData回调中处理高亮，确保UI已更新
      this.processHighlight();
    });
  },



  /**
   * 跳过题目 - 不计入任何统计数据
   */
  skipQuestion: function() {
    // 跳过题目不做任何学习状态更新，不计入答题统计
    // 直接进入下一题，不更新score和actualAnsweredQuestions
    console.log('跳过题目，不计入统计数据');
    this.nextQuestion();
  },

    /**
   * 显示下一题或结束测验
   */
  nextQuestion: function() {
    this.setData({ showQuestion: false });

    wx.nextTick(() => {
      if ((this.data.quizMode === 'quick' && this.data.currentQuestionIndex >= this.data.totalQuestions - 1) ||
        (this.data.quizMode === 'endless' && this.data.currentQuestionIndex >= this.data.questions.length - 1)) {
        this.endQuiz();
      } else {
        const nextIndex = this.data.currentQuestionIndex + 1;
        this.setData({
          currentQuestionIndex: nextIndex,
          userAnswer: '',
          selectedOption: null,
          isUserAnswerEmpty: true,
          showAnswerCard: false,
          isCorrect: false,
          showQuestion: true
        });
      }
    });
  },

  endQuiz: function() {
    this.clearTimer();
    const { score, actualAnsweredQuestions, timeSpent, quizMode, fromMistakes, coinsEarned } = this.data;
    const accuracy = actualAnsweredQuestions > 0 ? score / actualAnsweredQuestions : 0;
    const resultLevel = quizService.calculateResultLevel(accuracy);

    let url = `/pages/quiz-result/quiz-result?score=${score}&totalQuestions=${actualAnsweredQuestions}&timeSpent=${timeSpent}&accuracy=${accuracy.toFixed(2)}&resultLevel=${resultLevel}&coinsEarned=${coinsEarned}`;
    if (quizMode === 'mistakes') {
      url += `&fromMistakes=true`;
    }

    wx.reLaunch({
      url: url
    });
  },

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

  clearTimer: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  formatTime: function(seconds) {
    return quizService.formatTime(seconds);
  },

  onReady: function() {},
  onShow: function() {
    if (!this.data.timer && this.data.questions.length > 0 && !this.data.showAnswerCard && this.data.currentQuestionIndex < (this.data.quizMode === 'quick' ? this.data.totalQuestions : this.data.questions.length)) {
      this.startTimer();
    }
  },
  onHide: function() {
    this.clearTimer();
  },
  onUnload: function() {
    this.clearTimer();
  },
  /**
   * 标记单词为已背
   * @param {object} wordInfo - 单词信息对象
   */
  markWordAsLearned: function(wordInfo) {
    try {
      // 获取词典ID，优先使用当前词典ID，如果是'all'则尝试从单词来源获取
      let dictionaryId = this.data.dictionaryId;
      
      // 如果是混合模式('all')，尝试从单词的sourceDictionary字段获取
      if (dictionaryId === 'all' && wordInfo.sourceDictionary) {
        dictionaryId = wordInfo.sourceDictionary;
      }
      
      // 如果仍然无法确定词典ID，记录警告但不阻止程序运行
      if (!dictionaryId || dictionaryId === 'all') {
        console.warn('无法确定单词所属词典，将使用默认词典标记:', wordInfo);
        dictionaryId = 'everyones_japanese'; // 使用默认词典
      }
      
      // 调用学习进度管理器标记为已背
      const success = learnedManager.markWordAsLearned(wordInfo, dictionaryId);
      
      if (success) {
        console.log(`单词已标记为已背: ${wordInfo['假名'] || wordInfo['汉字']} (${dictionaryId})`);
      }
    } catch (error) {
      console.error('标记单词为已背时出错:', error);
    }
  },

  resetQuizState: function() {
    this.clearTimer();
    this.setData({
      currentQuestionIndex: 0,
      actualAnsweredQuestions: 0, // 重置实际回答题数
      userAnswer: '',
      isUserAnswerEmpty: true,
      selectedOption: null,
      showAnswerCard: false,
      isCorrect: false,
      score: 0,
      timeSpent: 0,
    });
  }
});