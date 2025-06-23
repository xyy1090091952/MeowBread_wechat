// pages/quiz/quiz.js
/**
 * @file 答题页面核心逻辑
 * @author MeowBread Team
 */
const quizService = require('../../utils/quiz.service.js');
const mistakeManager = require('../../utils/mistakeManager.js');

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
    timeSpent: 0, // 用时
    formattedTime: '00:00', // 格式化后的时间
    timer: null, // 计时器
    isLoading: true, // 加载状态
    showQuestion: true, // 用于控制题目显示/隐藏以触发动画
    highlightParticles: true, // 新增：是否高亮助词
    processedExampleSentence: '' // 新增：处理后的例句
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
      userAnswer: '',
      isUserAnswerEmpty: true,
      selectedOption: null,
      showAnswerCard: false,
      isCorrect: false,
      timeSpent: 0,
      formattedTime: '00:00',
    });

    this.startTimer();
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

    if (isCorrect) {
      mistakeManager.correctMistake(currentQ.wordInfo);
    } else {
      mistakeManager.addMistake(currentQ.wordInfo);
    }

    this.setData({
      isCorrect: isCorrect,
      showAnswerCard: true,
      score: this.data.score + (isCorrect ? 1 : 0)
    }, () => {
      // 在setData回调中处理高亮，确保UI已更新
      this.processHighlight();
    });
  },



  skipQuestion: function() {
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
    const displayedTotalQuestions = this.data.quizMode === 'quick' ? this.data.totalQuestions : this.data.questions.length;
    const { score, timeSpent } = this.data;
    const accuracy = displayedTotalQuestions > 0 ? (score / displayedTotalQuestions) : 0;

    let resultLevel = '';
    if (accuracy <= 0.2) resultLevel = 'noob';
    else if (accuracy <= 0.8) resultLevel = 'normal';
    else resultLevel = 'perfect';

    wx.redirectTo({
      url: `/pages/quiz-result/quiz-result?score=${score}&totalQuestions=${displayedTotalQuestions}&timeSpent=${timeSpent}&accuracy=${accuracy.toFixed(2)}&resultLevel=${resultLevel}&fromMistakes=${this.data.fromMistakes || false}`
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
  resetQuizState: function() {
    this.clearTimer();
    this.setData({
      currentQuestionIndex: 0,
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