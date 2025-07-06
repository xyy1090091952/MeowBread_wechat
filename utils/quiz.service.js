/**
 * @file 答题页面服务层 (考官)
 * @description 
 *   职责：作为“考官”，组织和管理整场答题活动，负责流程控制、题目生成、答案判断等核心业务逻辑。
 *   特点：调用`wordManager`获取单词，调用`filterManager`获取筛选配置，协调各个模块完成一场完整的答题。
 *   比喻：应用的“考官”，负责整场考试的顺利进行。
 */
const quizUtils = require('./quizUtils.js');
const wordManager = require('./wordManager.js');
const mistakeManager = require('./mistakeManager.js');
const filterManager = require('./filterManager.js');

const quizService = {
  /**
   * 初始化测验配置
   * @param {object} options - 页面启动参数
   * @returns {object} 初始化后的页面数据
   */
  initializeQuiz(options) {
    if (options.from === 'mistakes' && options.words) {
      const reviewWords = JSON.parse(options.words);
      const quizFilter = filterManager.getFilter() || {};
      const selectedQuestionTypes = quizFilter.selectedQuestionTypes || ['zh_to_jp_choice', 'jp_to_zh_choice'];

      const allWordsInLesson = reviewWords.map(word => ({ data: word, sourceDictionary: 'mistakes', lesson: 'review' }));
      const questions = this.generateQuestions(allWordsInLesson, selectedQuestionTypes);

      return {
        quizMode: 'endless',
        allWordsInLesson,
        questions,
        totalQuestions: questions.length,
        currentFilterDisplay: '错题重练',
        selectedQuestionTypes,
        fromMistakes: true,
        isLoading: false,
      };
    }

    let quizFilter = filterManager.getFilter();
    if (!quizFilter || !quizFilter.selectedLessonFiles || quizFilter.selectedLessonFiles.length === 0) {
      quizFilter = {
        selectedDictionaryName: '全部辞典',
        selectedLessonFiles: ['ALL_DICTIONARIES_ALL_LESSONS'],
        selectedLessonName: '全部课程',
        dictionaryId: 'all',
        basePath: 'all',
        quizMode: options.mode || 'quick'
      };
    }

    const { selectedLessonFiles, dictionaryId, basePath, selectedQuestionTypes, selectedDictionaryName, selectedLessonName } = quizFilter;
    const quizMode = options.mode || quizFilter.quizMode || 'quick';
    const words = wordManager.getWordsByFilter({ lessonFiles: selectedLessonFiles, dictionaryId });
    const questions = this.selectWordsForQuiz(words, quizMode, selectedQuestionTypes);

    return {
      quizMode,
      lessonFiles: selectedLessonFiles,
      dictionaryId,
      basePath,
      allWordsInLesson: words,
      questions,
      totalQuestions: questions.length,
      currentFilterDisplay: `${selectedDictionaryName} - ${selectedLessonName}`,
      selectedQuestionTypes: selectedQuestionTypes || ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'],
      isLoading: false,
    };
  },

  /**
   * 根据单词列表和题型生成问题
   * @param {Array} allWords - 所有单词的列表
   * @param {Array} questionTypes - 选定的题型
   * @returns {Array} - 生成的问题列表
   */
  generateQuestions(allWords, questionTypes) {
    let questions = [];
    if (!questionTypes || questionTypes.length === 0) {
      questionTypes = ['zh_to_jp_choice', 'jp_to_zh_choice'];
    }

    allWords.forEach(wordInfo => {
      const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      const question = quizUtils.formatQuestion(wordInfo, randomType, allWords);
      if (question) {
        questions.push(question);
      }
    });

    return questions.sort(() => Math.random() - 0.5);
  },

  /**
   * 为测验选择单词并生成问题
   * @param {Array} allWords - 所有单词
   * @param {string} mode - 测验模式 ('quick' 或 'endless')
   * @param {Array} selectedQuestionTypes - 选择的题型
   * @returns {Array} - 最终的问题列表
   */
  selectWordsForQuiz(allWords, mode, selectedQuestionTypes) {
    let finalQuestions = [];
    if (!selectedQuestionTypes || selectedQuestionTypes.length === 0 || !allWords || allWords.length === 0) {
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

    finalQuestions.sort(() => 0.5 - Math.random());

    if (mode === 'quick') {
      return finalQuestions.slice(0, Math.min(finalQuestions.length, 30));
    }
    return finalQuestions;
  },

  /**
   * 校验答案
   * @param {object} currentQuestion - 当前题目对象
   * @param {string} userAnswer - 用户答案
   * @returns {boolean} - 答案是否正确
   */
  checkAnswer(currentQuestion, userAnswer) {
    const userAnswerTrimmed = userAnswer.trim();
    if (currentQuestion.type === 'choice') {
      return userAnswerTrimmed === currentQuestion.answer;
    }

    const correctAnswerData = currentQuestion.answer;
    if (typeof correctAnswerData === 'object' && correctAnswerData !== null && correctAnswerData.hasOwnProperty('word')) {
      return (userAnswerTrimmed === correctAnswerData.word) || 
             (correctAnswerData.kana && userAnswerTrimmed === correctAnswerData.kana);
    } else if (typeof correctAnswerData === 'string') {
      return userAnswerTrimmed === correctAnswerData;
    }
    return false;
  },

  /**
   * 处理例句高亮
   * @param {string} sentence - 原始例句
   * @param {boolean} highlight - 是否需要高亮
   * @returns {string} - 处理后的例句
   */
  getHighlightedSentence(sentence, highlight) {
    if (!sentence) return '';
    if (highlight) {
      const particles = ['は', 'が', 'を', 'に', 'で', 'と', 'から', 'まで', 'より', 'の', 'へ', 'や', 'か', 'も', 'ば', 'ながら', 'たり', 'たら', 'なら'];
      
      let processedSentence = sentence;
      
      // 只处理最常见的误判情况
      // 1. です中的で不高亮
      processedSentence = processedSentence.replace(/です/g, '__TEMP_DESU__');
      
      // 2. では中的で和は不高亮（では作为一个整体的助词）
      processedSentence = processedSentence.replace(/では/g, '__TEMP_DEWA__');
      
      // 对剩余部分进行助词高亮
      particles.forEach(particle => {
        const regex = new RegExp(particle, 'g');
        processedSentence = processedSentence.replace(regex, `<span class="highlight">${particle}</span>`);
      });
      
      // 恢复被替换的内容
      processedSentence = processedSentence.replace(/__TEMP_DESU__/g, 'です');
      processedSentence = processedSentence.replace(/__TEMP_DEWA__/g, 'では');
      
      return processedSentence;
    }
    return sentence;
  },

  /**
   * 格式化时间
   * @param {number} seconds - 总秒数
   * @returns {string} - 格式化的时间字符串 (MM:SS)
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  }
};

module.exports = quizService;