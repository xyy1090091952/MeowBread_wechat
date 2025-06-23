const quizUtils = require('./quizUtils.js');
const dictionaries = require('../database/dictionaries.js');
const lessonMap = require('../database/lesson-map.js');

/**
 * @description 测验数据管理器，负责加载、筛选和生成测验所需的单词和问题
 */
const quizDataManager = {
  /**
   * @description 根据筛选条件加载单词和问题
   * @param {object} options - 页面加载选项，包含筛选条件和模式
   * @returns {Array} 生成的问题列表
   */
  loadQuestions: function(options) {
    const { from, words, filterConditions, quizMode, totalQuestions } = options;
    let finalWords = [];

    if (from === 'mistakes') {
      finalWords = JSON.parse(words);
    } else if (filterConditions) {
      const conditions = JSON.parse(filterConditions);
      let allWords = [];

      if (conditions.dictionaryId === 'all') {
        // 加载所有词典的所有单词
        Object.values(lessonMap).forEach(book => {
          Object.values(book.lessons).forEach(lesson => {
            allWords.push(...lesson.words);
          });
        });
      } else {
        const dictionaryInfo = dictionaries.dictionaries.find(d => d.id === conditions.dictionaryId);
        if (dictionaryInfo) {
          const selectedBook = lessonMap[dictionaryInfo.id];
          if (selectedBook) {
            if (conditions.lessonId === 'all') {
              // 加载特定词典的所有单词
              Object.values(selectedBook.lessons).forEach(lesson => {
                allWords.push(...lesson.words);
              });
            } else if (selectedBook.lessons[conditions.lessonId]) {
              // 加载特定课程的单词
              allWords = selectedBook.lessons[conditions.lessonId].words;
            }
          }
        }
      }
      finalWords = this.selectWordsForQuiz(allWords, quizMode, totalQuestions);
    }

    return this.generateQuestions(finalWords, options.selectedQuestionTypes);
  },

  /**
   * @description 根据测验模式从单词列表中选择单词
   * @param {Array} allWords - 所有可用单词的列表
   * @param {string} quizMode - 测验模式 ('quick' 或 'endless')
   * @param {number} totalQuestions - 在 'quick' 模式下要选择的单词数
   * @returns {Array} 选择用于测验的单词列表
   */
  selectWordsForQuiz: function(allWords, quizMode, totalQuestions) {
    let selectedWords = [];
    if (quizMode === 'quick') {
      // 快速模式：随机选择N个单词
      selectedWords = allWords.sort(() => 0.5 - Math.random()).slice(0, totalQuestions);
    } else {
      // 无尽模式：使用所有单词并打乱顺序
      selectedWords = allWords.sort(() => 0.5 - Math.random());
    }
    return selectedWords;
  },

  /**
   * @description 从单词列表生成问题列表
   * @param {Array} allWords - 用于生成问题的单词列表
   * @param {Array} questionTypes - 要生成的问题类型
   * @returns {Array} 生成的问题列表
   */
  generateQuestions: function(allWords, questionTypes) {
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

    return questions;
  }
};

module.exports = quizDataManager;