// pages/quiz/quiz.js
/**
 * @file 答题页面核心逻辑
 * @author MeowBread Team
 */
const { WORD_STATUS } = require('../../utils/constants.js');
const quizUtils = require('../../utils/quizUtils.js');

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

      this.setData({
        quizMode: 'endless', // 错题重练通常是无尽模式
        allWordsInLesson: reviewWords.map(word => ({ data: word, sourceDictionary: 'mistakes', lesson: 'review' })),
        isLoading: false,
        currentFilterDisplay: '错题重练',
        selectedQuestionTypes: selectedQuestionTypes, // 使用用户选择的题型
        score: 0,
        currentQuestionIndex: 0,
        userAnswer: '',
        isUserAnswerEmpty: true,
        selectedOption: null,
        showAnswerCard: false,
        isCorrect: false,
        fromMistakes: true // 增加一个标志位，用于后续判断
      });
      this.generateQuestions();
      this.startTimer();
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
    this.loadQuestionsAndWords();
  },

  // 生成问题列表
    /**
   * 从 allWordsInLesson 生成问题列表
   * 逻辑：为每个单词随机选择一种题型，然后打乱题目顺序
   */
  generateQuestions: function() {
    let allWords = this.data.allWordsInLesson;
    let questionTypes = this.data.selectedQuestionTypes;
    let questions = [];

    if (!questionTypes || questionTypes.length === 0) {
      // 如果没有指定题型，则使用默认题型
      questionTypes = ['zh_to_jp_choice', 'jp_to_zh_choice'];
    }

    allWords.forEach(wordInfo => {
      // 为每个单词只生成一个随机类型的题目
      const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      const question = quizUtils.formatQuestion(wordInfo, randomType, allWords);
      if (question) {
        questions.push(question);
      }
    });

    // 随机打乱题目顺序
    questions.sort(() => Math.random() - 0.5);

    this.setData({
      questions: questions,
      totalQuestions: questions.length,
      isLoading: false
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

  // 加载单词和题目数据
  // 注意：微信小程序中 require() 的路径不能是动态拼接的变量。
  // 当前的实现方式在小程序环境中会报错。
  // 理想的实现是创建一个映射文件，将所有课程静态 require 进来，然后通过 key 访问。
  // 此处仅修复语法错误，保留原有逻辑以便开发者后续重构。
  loadQuestionsAndWords: function() {
    this.setData({ isLoading: true, timeSpent: 0 });
    const { lessonFiles } = this.data;
    let wordsToLoad = [];

    try {
      const allDictionariesData = require('../../database/dictionaries.js');
      if (!allDictionariesData || !allDictionariesData.dictionaries) {
        console.error('无法加载或解析 dictionaries.js');
        wx.showModal({ title: '错误', content: '词典配置文件缺失或格式错误。', showCancel: false, success: () => wx.navigateBack() });
        return;
      }
      const dictionariesConfig = allDictionariesData.dictionaries;

      // 从自动生成的映射文件中加载所有课程，实现动态加载
      const allLessons = require('../../database/lesson-map.js');

      const processLessonFile = (dict, lessonFileName) => {
        const fullPath = `${dict.id}/${lessonFileName}`;
        const lessonData = allLessons[fullPath];
        if (lessonData && Array.isArray(lessonData)) {
          wordsToLoad.push(...lessonData.map(item => ({ 
            data: item.data, 
            sourceDictionary: dict.id, 
            lesson: lessonFileName.replace('.js', '')
          })));
        } else {
          console.warn(`无法从预加载数据中找到课程: ${fullPath}`);
        }
      };

      lessonFiles.forEach(lessonFile => {
        if (lessonFile === 'ALL_DICTIONARIES_ALL_LESSONS') {
          dictionariesConfig.forEach(dict => {
            if (dict.lesson_files && Array.isArray(dict.lesson_files)) {
              dict.lesson_files.forEach(lessonPattern => {
                const lessonFileName = lessonPattern.split('/').pop();
                processLessonFile(dict, lessonFileName);
              });
            }
          });
        } else if (lessonFile.startsWith('DICTIONARY_') && lessonFile.endsWith('_ALL_LESSONS')) {
          // 修正逻辑：正确处理“特定词典的全部课程”
          // lessonFile 的格式是 DICTIONARY_{dict_id}_ALL_LESSONS
          const parts = lessonFile.split('_');
          const targetDictId = parts.slice(1, parts.length - 2).join('_'); // 允许词典ID中包含下划线

          const targetDictionary = dictionariesConfig.find(d => d.id === targetDictId);
          if (targetDictionary && targetDictionary.lesson_files) {
            targetDictionary.lesson_files.forEach(fullPathPattern => {
              // fullPathPattern 的格式是 'dict_id/lesson_name.js'
              const lessonFileName = fullPathPattern.split('/').pop();
              processLessonFile(targetDictionary, lessonFileName);
            });
          }

        } else {
          // 改进的解析逻辑，以处理词典ID中包含下划线的情况
          let foundDictionary = false;
          for (const dict of dictionariesConfig) {
            if (lessonFile.startsWith(dict.id + '_')) {
              const lessonName = lessonFile.substring(dict.id.length + 1);
              const lessonFileName = `${lessonName}.js`;
              // 修正：dictionaries.js 中的 lesson_files 路径是 '词典ID/课程文件名.js'
              const fullPathPattern = `${dict.id}/${lessonFileName}`;

              if (dict.lesson_files && dict.lesson_files.includes(fullPathPattern)) {
                processLessonFile(dict, lessonFileName);
                foundDictionary = true;
                break; // 找到并处理后，跳出循环
              } else {
                console.warn(`课程文件 ${lessonFileName} (检查路径: ${fullPathPattern}) 未在词典 ${dict.id} 的 lesson_files 中配置。`);
              }
            }
          }
          if (!foundDictionary) {
            console.warn(`无法为课程文件标识 ${lessonFile} 找到匹配的词典。`);
          }
        }
      });

      if (wordsToLoad.length === 0) {
        wx.showModal({
          title: '提示',
          content: '当前筛选条件下没有找到任何单词，请尝试调整筛选范围。',
          showCancel: false,
          confirmText: '返回筛选',
          success: () => wx.navigateBack(),
        });
        this.setData({ isLoading: false });
        return;
      }

      this.setData({ allWordsInLesson: wordsToLoad, isLoading: false });
      const questions = this.selectWordsForQuiz(wordsToLoad, this.data.quizMode);
      this.setData({ 
        questions: questions,
        totalQuestions: questions.length
      });

      if (questions.length > 0) {
        this.startTimer();
      }
    } catch (e) {
      console.error('加载题目和单词时发生严重错误:', e);
      this.setData({ isLoading: false });
      wx.showModal({
        title: '加载失败',
        content: '无法加载课程数据，请稍后重试。',
        showCancel: false,
        success: () => wx.navigateBack(),
      });
    }
  },

  selectWordsForQuiz: function(allWords, mode) {
    const { selectedQuestionTypes } = this.data;
    let finalQuestions = [];
    if (!selectedQuestionTypes || selectedQuestionTypes.length === 0 || !allWords || allWords.length === 0) {
      console.warn('没有选择题型或没有单词数据，无法生成题目。');
      return [];
    }

    let shuffledWords = [...allWords].sort(() => 0.5 - Math.random());

    shuffledWords.forEach(word => {
      const randomTypeIndex = Math.floor(Math.random() * selectedQuestionTypes.length);
      const randomQuestionType = selectedQuestionTypes[randomTypeIndex];
      const question = quizUtils.formatQuestion(word, randomQuestionType, shuffledWords);
      if (question) {
        finalQuestions.push(question);
      }
    });

    if (finalQuestions.length === 0) {
      console.warn('根据当前筛选条件和随机选择的题型组合，未能为任何单词生成有效题目。');
      return [];
    }

    finalQuestions.sort(() => 0.5 - Math.random());

    if (mode === 'quick') {
      return finalQuestions.slice(0, Math.min(finalQuestions.length, 30));
    } else {
      return finalQuestions;
    }
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

  // 更新错题列表，使用同步API避免数据竞争
    /**
   * 将答错的单词添加到本地缓存的错题库中
   * @param {object} wordInfo - 包含完整单词信息的对象
   */
  updateMistakeList: function(wordInfo) {
    let mistakes = wx.getStorageSync('mistakeList') || [];
    // 使用更健壮的匹配逻辑，同时考虑汉字和假名
    const existing = mistakes.find(item => {
      if (!item.data) return false;
      const kanjiMatch = (!wordInfo['汉字'] && !item.data['汉字']) || (wordInfo['汉字'] === item.data['汉字']);
      const kanaMatch = wordInfo['假名'] === item.data['假名'];
      return kanjiMatch && kanaMatch;
    });

    if (!existing) {
            mistakes.push({ data: wordInfo, status: WORD_STATUS.ERROR });
      wx.setStorageSync('mistakeList', mistakes);
      console.log(`单词 "${wordInfo['汉字'] || wordInfo['假名']}" 已添加到错题库`);
    }
  },

  // 将错题状态从 '错误' 更新为 '修正'
    /**
   * 在错题重练模式下，将答对的单词状态从 'error' 更新为 'corrected'
   * @param {object} word - 包含完整单词信息的对象
   */
  correctMistake: function(word) {
    let mistakeList = wx.getStorageSync('mistakeList') || [];
    
    // 查找错题库中匹配的单词索引
    const mistakeIndex = mistakeList.findIndex(item => {
      if (!item.data) return false;
      // 严格匹配：汉字（如果存在）和假名都必须一致
      const kanjiMatch = (!word['汉字'] && !item.data['汉字']) || (word['汉字'] === item.data['汉字']);
      const kanaMatch = word['假名'] === item.data['假名'];
      return kanjiMatch && kanaMatch;
    });

    // 如果找到匹配的单词，并且其状态为'错误'，则更新状态
        if (mistakeIndex !== -1 && (mistakeList[mistakeIndex].status === '错误' || mistakeList[mistakeIndex].status === WORD_STATUS.ERROR)) {
            mistakeList[mistakeIndex].status = WORD_STATUS.CORRECTED; // 更新为“修正”状态
      wx.setStorageSync('mistakeList', mistakeList);
      console.log(`单词 "${word['汉字'] || word['假名']}" 状态已更新为 '修正'`);
    }
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