// pages/quiz/quiz.js
/**
 * @file 答题页面核心逻辑
 * @author MeowBread Team
 */
const mistakeManager = require('../../utils/mistakeManager.js');
const quizDataManager = require('../../utils/quizDataManager.js');

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
    if (options.from === 'mistakes' && options.words) {
      const reviewWords = JSON.parse(options.words);
      // 从缓存中读取用户设置的题型
      const quizFilter = wx.getStorageSync('quizFilter') || {};
      const selectedQuestionTypes = quizFilter.selectedQuestionTypes || ['zh_to_jp_choice', 'jp_to_zh_choice']; // 默认题型

      const questions = quizDataManager.generateQuestions(
        reviewWords.map(word => ({ data: word, sourceDictionary: 'mistakes', lesson: 'review' })),
        selectedQuestionTypes
      );

      this.setData({
        quizMode: 'endless',
        questions: questions,
        totalQuestions: questions.length,
        isLoading: false,
        currentFilterDisplay: '错题重练',
        selectedQuestionTypes: selectedQuestionTypes,
        score: 0,
        currentQuestionIndex: 0,
        userAnswer: '',
        isUserAnswerEmpty: true,
        selectedOption: null,
        showAnswerCard: false,
        isCorrect: false,
        fromMistakes: true
      });

      if (questions.length > 0) {
        this.startTimer();
      } else {
        wx.showModal({
          title: '提示',
          content: '没有需要重练的错题。',
          showCancel: false,
          confirmText: '返回',
          success: () => wx.navigateBack(),
        });
      }
      return;
    }

    let quizFilter = wx.getStorageSync('quizFilter');

    if (!quizFilter || !quizFilter.selectedLessonFiles || quizFilter.selectedLessonFiles.length === 0) {
      console.log('quiz.js: 未找到有效筛选条件，将使用默认“全部辞典”范围');
      quizFilter = {
        selectedDictionaryName: '全部辞典',
        selectedLessonFiles: ['ALL_DICTIONARIES_ALL_LESSONS'],
        selectedLessonName: '全部课程',
        dictionaryId: 'all',
        basePath: 'all',
        quizMode: options.mode || 'quick'
      };
    }

    const lessonFiles = quizFilter.selectedLessonFiles;
    const dictionaryId = quizFilter.dictionaryId;
    const basePath = quizFilter.basePath;
    const quizMode = options.mode || (quizFilter && quizFilter.quizMode) || 'quick';
    const currentFilterDisplay = `${quizFilter.selectedDictionaryName} - ${quizFilter.selectedLessonName}`;
    const selectedQuestionTypes = quizFilter.selectedQuestionTypes || ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'];

    this.setData({
      quizMode: quizMode,
      lessonFiles: lessonFiles,
      dictionaryId: dictionaryId,
      basePath: basePath,
      isLoading: true,
      currentFilterDisplay: currentFilterDisplay,
      selectedQuestionTypes: selectedQuestionTypes,
      score: 0,
      currentQuestionIndex: 0,
      userAnswer: '',
      isUserAnswerEmpty: true,
      selectedOption: null,
      showAnswerCard: false,
      isCorrect: false,
    });

    if (!lessonFiles || lessonFiles.length === 0) {
      wx.showModal({
        title: '错误',
        content: '未指定课程范围，无法开始答题。请先去“题库筛选”页面选择。',
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          wx.switchTab({
            url: '/pages/answer/answer'
          });
        }
      });
      return;
    }
    this.setData({ timeSpent: 0 });
    const questions = quizDataManager.loadQuestions({
      ...options,
      filterConditions: JSON.stringify(quizFilter),
      quizMode: quizMode,
      totalQuestions: this.data.totalQuestions,
      selectedQuestionTypes: selectedQuestionTypes
    });
    this.setData({
      questions: questions,
      totalQuestions: questions.length
    });

    if (questions.length > 0) {
      this.startTimer();
    } else {
      wx.showModal({
        title: '提示',
        content: '根据当前筛选条件，没有可生成的题目。请尝试更改筛选设置。',
        showCancel: false,
        confirmText: '返回',
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },



  // 新增：切换助词高亮状态
  toggleHighlight: function() {
    const newState = !this.data.highlightParticles;
    this.setData({ highlightParticles: newState });
    if (this.data.showAnswerCard) {
      this.processHighlight(); // 如果答案卡已显示，立即处理高亮
    }
  },

  // 新增：处理例句中的助词高亮
  processHighlight: function() {
    const currentQuestion = this.data.questions[this.data.currentQuestionIndex];
    if (!currentQuestion || !currentQuestion.wordInfo || !currentQuestion.wordInfo['例句']) {
      this.setData({ processedExampleSentence: '' });
      return;
    }

    let sentence = currentQuestion.wordInfo['例句'];

    if (this.data.highlightParticles) {
      const particles = ['は', 'が', 'を', 'に', 'で', 'と', 'から', 'まで', 'より', 'の', 'へ', 'や', 'か', 'も', 'ば', 'ながら', 'たり', 'たら', 'なら'];
      // 使用正则表达式为所有助词添加高亮标签
      const regex = new RegExp(`(${particles.join('|')})`, 'g');
      sentence = sentence.replace(regex, '<span class="highlight">$1</span>');
    }

    this.setData({ processedExampleSentence: sentence });
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
    let isCorrect = false;
    const userAnswerTrimmed = this.data.userAnswer.trim();

    if (currentQ.type === 'choice') {
      isCorrect = userAnswerTrimmed === currentQ.answer;
    } else {
      const correctAnswerData = currentQ.answer;
      if (typeof correctAnswerData === 'object' && correctAnswerData !== null && correctAnswerData.hasOwnProperty('word')) {
        isCorrect = (userAnswerTrimmed === correctAnswerData.word) || 
                    (correctAnswerData.kana && userAnswerTrimmed === correctAnswerData.kana);
      } else if (typeof correctAnswerData === 'string') {
        isCorrect = userAnswerTrimmed === correctAnswerData;
      } else {
        console.error("未知答案格式: ", correctAnswerData);
        isCorrect = userAnswerTrimmed === correctAnswerData;
      }
    }

    if (isCorrect) {
      // 如果答对了，检查是否需要将错题状态从 'error' 更新为 'corrected'
      this.correctMistake(currentQ.wordInfo);
    } else {
      // 如果答错了，将单词添加到错题库
      this.updateMistakeList(currentQ.wordInfo);
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

  updateMistakeList: function(wordInfo) {
    mistakeManager.addMistake(wordInfo);
  },

  correctMistake: function(word) {
    mistakeManager.correctMistake(word);

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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
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