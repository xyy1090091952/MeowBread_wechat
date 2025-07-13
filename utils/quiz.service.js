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
        quizMode: options.mode || 'quick',
        selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'] // 添加默认题型
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
   * @param {string} mode - 测验模式 ('quick', 'endless', 或 'course')
   * @param {Array} selectedQuestionTypes - 选择的题型
   * @returns {Array} - 最终的问题列表
   */
  selectWordsForQuiz(allWords, mode, selectedQuestionTypes) {
    let finalQuestions = [];
    
    // 如果没有选择题型，使用默认题型
    if (!selectedQuestionTypes || selectedQuestionTypes.length === 0) {
      selectedQuestionTypes = ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'];
    }
    
    if (!allWords || allWords.length === 0) {
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

    // 快速模式和课程模式都限制为30道题，如果不足则从历史记录补充
    if (mode === 'quick' || mode === 'course') {
      const targetQuestionCount = 30;
      
      if (finalQuestions.length < targetQuestionCount) {
        // 如果当前题目不足30道，尝试从历史答题记录中补充
        const supplementQuestions = this.getSupplementQuestions(
          finalQuestions, 
          targetQuestionCount - finalQuestions.length, 
          selectedQuestionTypes,
          mode
        );
        
        // 将补充的题目添加到原题目列表中
        finalQuestions.push(...supplementQuestions);
        
        // 重新打乱顺序
        finalQuestions.sort(() => 0.5 - Math.random());
        
        console.log(`课程单词不足，已从历史记录补充 ${supplementQuestions.length} 道题目，总计 ${finalQuestions.length} 道题`);
      }
      
      return finalQuestions.slice(0, Math.min(finalQuestions.length, targetQuestionCount));
    }
    return finalQuestions;
  },

  /**
   * 从历史答题记录中获取补充题目
   * @param {Array} existingQuestions - 已有的题目列表
   * @param {number} needCount - 需要补充的题目数量
   * @param {Array} selectedQuestionTypes - 选择的题型
   * @param {string} mode - 答题模式
   * @returns {Array} - 补充的题目列表
   */
  getSupplementQuestions(existingQuestions, needCount, selectedQuestionTypes, mode) {
    const supplementQuestions = [];
    
    try {
      // 只在course模式下从历史记录补充
      if (mode !== 'course') {
        return supplementQuestions;
      }
      
      // 获取当前课程的筛选信息
      const quizFilter = filterManager.getFilter();
      if (!quizFilter || !quizFilter.dictionaryId || !quizFilter.selectedLessonKey) {
        return supplementQuestions;
      }
      
      const { dictionaryId, selectedLessonKey } = quizFilter;
      
      // 获取该课程的历史已学单词
      const learnedManager = require('./learnedManager.js');
      const learnedWords = learnedManager.getLearnedWordsForCourse(dictionaryId, selectedLessonKey);
      
      if (learnedWords.length === 0) {
        console.log('该课程暂无历史答题记录，无法补充题目');
        return supplementQuestions;
      }
      
      // 获取已有题目的单词ID集合，避免重复
      const existingWordIds = new Set();
      existingQuestions.forEach(question => {
        if (question.wordInfo) {
          const wordId = this.getWordId(question.wordInfo);
          existingWordIds.add(wordId);
        }
      });
      
      // 从历史记录中筛选出未重复的单词
      const availableHistoryWords = learnedWords.filter(learnedWord => {
        const wordId = learnedWord.id;
        return !existingWordIds.has(wordId);
      });
      
      // 随机选择需要的数量
      const shuffledHistoryWords = availableHistoryWords.sort(() => 0.5 - Math.random());
      const selectedHistoryWords = shuffledHistoryWords.slice(0, needCount);
      
      // 为选中的历史单词生成题目
      selectedHistoryWords.forEach(learnedWord => {
        const randomTypeIndex = Math.floor(Math.random() * selectedQuestionTypes.length);
        const randomQuestionType = selectedQuestionTypes[randomTypeIndex];
        
        // 将历史单词转换为题目格式需要的格式
        const wordForQuestion = {
          data: learnedWord.wordData,
          sourceDictionary: dictionaryId,
          lesson: selectedLessonKey
        };
        
        const question = quizUtils.formatQuestion(wordForQuestion, randomQuestionType, [wordForQuestion]);
        if (question) {
          // 标记这是补充题目
          question.isSupplementary = true;
          supplementQuestions.push(question);
        }
      });
      
    } catch (error) {
      console.error('获取补充题目失败:', error);
    }
    
    return supplementQuestions;
  },

  /**
   * 获取单词的唯一标识符（与learnedManager保持一致）
   * @param {object} wordData - 单词数据对象
   * @returns {string} 单词的唯一标识符
   */
  getWordId(wordData) {
    const kana = wordData['假名'] || '';
    const kanji = wordData['汉字'] || '';
    const meaning = wordData['中文'] || '';
    return `${kana}_${kanji}_${meaning}`.replace(/\s+/g, '');
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
  },

  /**
   * 根据准确率计算结果等级
   * @param {number} accuracy - 准确率 (0到1之间)
   * @returns {string} - 结果等级 ('noob', 'normal', 'perfect')
   */
  calculateResultLevel(accuracy) {
    if (accuracy <= 0.2) return 'noob';
    if (accuracy <= 0.8) return 'normal';
    return 'perfect';
  }
};

module.exports = quizService;