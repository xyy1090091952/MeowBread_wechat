// pages/quiz/quiz.js
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
  onLoad: function(options) {
    if (options.from === 'mistakes' && options.words) {
      const reviewWords = JSON.parse(options.words);
      this.setData({
        quizMode: 'endless', // 错题重练通常是无尽模式
        allWordsInLesson: reviewWords.map(item => ({ data: item, sourceDictionary: 'mistakes', lesson: 'review' })),
        isLoading: false,
        currentFilterDisplay: '错题重练',
        selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'],
        score: 0,
        currentQuestionIndex: 0,
        userAnswer: '',
        isUserAnswerEmpty: true,
        selectedOption: null,
        showAnswerCard: false,
        isCorrect: false,
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
      const question = this.formatQuestion(word, randomQuestionType);
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

  mapPartOfSpeechToClassName: function(partOfSpeech) {
    const mapping = {
      '动词': 'verb', '自动词': 'intransitive-verb', '他动词': 'transitive-verb', '名词': 'noun',
      '形容词': 'adjective', '副词': 'adverb', '助词': 'particle', '连词': 'conjunction',
      '形容动词': 'adjectival-noun', '代词': 'pronoun', '数词': 'numeral'
    };
    return mapping[partOfSpeech] || partOfSpeech;
  },

  mapClassNameToPartOfSpeech: function(className) {
    const mapping = {
      'verb': '动词', 'intransitive-verb': '自动词', 'transitive-verb': '他动词', 'noun': '名词',
      'adjective': '形容词', 'adverb': '副词', 'particle': '助词', 'conjunction': '连词',
      'adjectival-noun': '形容动词', 'pronoun': '代词', 'numeral': '数词'
    };
    return mapping[className] || className;
  },

  formatQuestion: function(wordData, questionTypeToGenerate) {
    const word = wordData.data;
    if (!word || !word.中文 || (!word.汉字 && !word.假名)) {
      console.warn('formatQuestion: 无效的单词数据或缺少必要字段:', wordData);
      return null;
    }

    let questionText = '', correctAnswer = '', options = [], actualQuestionType = '', wordToDisplay = '', stemRemainder = '';
    const japaneseForm = word.汉字 || word.假名;
    const chineseMeaning = word.中文;

    switch (questionTypeToGenerate) {
      case 'zh_to_jp_choice':
        questionText = `「${chineseMeaning}」的日语是什么？`;
        correctAnswer = japaneseForm;
        actualQuestionType = 'choice';
        options = this.generateOptions(wordData, 'japanese');
        wordToDisplay = `「${chineseMeaning}」`;
        stemRemainder = '的日语是什么？';
        break;
      case 'jp_to_zh_choice':
        questionText = `「${japaneseForm}」的中文意思是什么？`;
        correctAnswer = chineseMeaning;
        actualQuestionType = 'choice';
        options = this.generateOptions(wordData, 'chinese');
        wordToDisplay = `「${japaneseForm}」`;
        stemRemainder = '的中文意思是什么？';
        break;
      case 'zh_to_jp_fill':
        questionText = `「${chineseMeaning}」的日语是？(可填汉字或假名)`;
        correctAnswer = { word: word.汉字, kana: word.假名 };
        actualQuestionType = 'fill';
        wordToDisplay = `「${chineseMeaning}」`;
        stemRemainder = '的日语是？(可填汉字或假名)';
        break;
      case 'jp_kanji_to_kana_fill':
        if (word.汉字 && word.假名 && word.汉字 !== word.假名) {
          questionText = `「${word.汉字}」的假名是？`;
          correctAnswer = word.假名;
          actualQuestionType = 'fill';
          wordToDisplay = `「${word.汉字}」`;
          stemRemainder = '的假名是？';
        } else {
          return null;
        }
        break;
      default:
        console.warn(`formatQuestion: 未知的题型请求 '${questionTypeToGenerate}'`);
        return null;
    }

    if (actualQuestionType === 'choice' && (!options || options.length === 0)) {
      console.warn(`无法为单词 '${japaneseForm}' 生成 '${questionTypeToGenerate}' 的选项。`);
      return null;
    }

    return {
      id: japaneseForm + '_' + questionTypeToGenerate,
      type: actualQuestionType,
      wordToDisplay: wordToDisplay,
      stemRemainder: stemRemainder,
      answer: correctAnswer,
      options: options,
      wordInfo: word,
      partOfSpeech: this.mapPartOfSpeechToClassName(word.词性 || ''),
      specificQuestionType: questionTypeToGenerate
    };
  },

  generateOptions: function(correctWordData, optionType) {
    const allWordsInLesson = this.data.allWordsInLesson;
    const correctWord = correctWordData.data;
    let correctAnswerText = '';
    if (optionType === 'chinese') {
        correctAnswerText = correctWord.中文;
    } else {
        correctAnswerText = correctWord.汉字 || correctWord.假名;
    }

    let options = [correctAnswerText];
    const distractorsPool = allWordsInLesson.filter(w => {
        const wData = w.data;
        if (optionType === 'chinese') {
            return wData.中文 !== correctAnswerText && wData.中文;
        } else {
            return (wData.汉字 || wData.假名) !== correctAnswerText && (wData.汉字 || wData.假名);
        }
    });

    while (options.length < 4 && distractorsPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * distractorsPool.length);
      const distractorWord = distractorsPool.splice(randomIndex, 1)[0].data;
      let distractorText = '';
      if (optionType === 'chinese') {
        distractorText = distractorWord.中文;
      } else {
        distractorText = distractorWord.汉字 || distractorWord.假名;
      }
      if (distractorText && !options.includes(distractorText)) {
        options.push(distractorText);
      }
    }

    return options.sort(() => 0.5 - Math.random());
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

    if (!isCorrect) {
      wx.getStorage({
        key: 'mistakeList',
        success: (res) => {
          let mistakes = res.data || [];
          const existing = mistakes.find(item => item.data.汉字 === currentQ.wordInfo.汉字 && item.data.假名 === currentQ.wordInfo.假名);
          if (!existing) {
            mistakes.push({ data: currentQ.wordInfo, status: '错误' });
            wx.setStorage({
              key: 'mistakeList',
              data: mistakes
            });
          }
        },
        fail: () => {
          let mistakes = [{ data: currentQ.wordInfo, status: '错误' }];
          wx.setStorage({
            key: 'mistakeList', // 修正：确保key与读取时一致
            data: mistakes
          });
        }
      });
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
      url: `/pages/quiz-result/quiz-result?score=${score}&totalQuestions=${displayedTotalQuestions}&timeSpent=${timeSpent}&accuracy=${accuracy.toFixed(2)}&resultLevel=${resultLevel}`
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