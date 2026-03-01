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
  async initializeQuiz(options) {
    if (options.from === 'mistakes' && options.words) {
      const reviewWords = JSON.parse(options.words);
      const quizFilter = filterManager.getFilter() || {};
      const selectedQuestionTypes = quizFilter.selectedQuestionTypes || ['zh_to_jp_choice', 'jp_to_zh_choice'];

      const allWordsInLesson = reviewWords.map(word => ({ data: word, sourceDictionary: 'mistakes', lesson: 'review' }));
      const questions = this.generateQuestions(allWordsInLesson, selectedQuestionTypes);

      return {
        quizMode: 'mistakes', // 修复：错题重练模式应该有独立的标识
        allWordsInLesson,
        questions,
        totalQuestions: questions.length,
        currentFilterDisplay: '错题重练',
        selectedQuestionTypes,
        fromMistakes: true,
        isLoading: false,
      };
    }

    try {
      let quizFilter = filterManager.getFilter();
      if (!quizFilter || !quizFilter.selectedLessonFiles || quizFilter.selectedLessonFiles.length === 0) {
        // 如果没有筛选条件，使用第一个词典作为默认
        const dictionariesData = require('../database/dictionaries.js');
        const firstDictionary = dictionariesData.dictionaries[0];
        
        quizFilter = {
          selectedDictionaryName: firstDictionary.name,
          selectedLessonFiles: [`DICTIONARY_${firstDictionary.id}_ALL_LESSONS`],
          selectedLessonName: '全部课程',
          dictionaryId: firstDictionary.id,
          basePath: firstDictionary.base_path || '', // 确保basePath始终有默认值
          quizMode: options.mode || 'quick',
          selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'] // 添加默认题型
        };
      }

      const { selectedLessonFiles, dictionaryId, selectedQuestionTypes, selectedDictionaryName, selectedLessonName } = quizFilter;
      // 确保basePath始终有一个有效的默认值，避免undefined导致的setData错误
      const basePath = quizFilter.basePath || '';
      const quizMode = options.mode || quizFilter.quizMode || 'quick';
      const words = await wordManager.getWordsByFilter({ lessonFiles: selectedLessonFiles, dictionaryId });
      const questions = this.selectWordsForQuiz(words, quizMode, selectedQuestionTypes);

      // 判断是否为标准模式（整本书）- 检查是否包含ALL_LESSONS
      const isStandardMode = selectedLessonFiles && selectedLessonFiles.some(file => file.includes('ALL_LESSONS'));
      
      // 根据模式设置不同的显示文本，确保始终有有效的默认值
      let currentFilterDisplay = '答题模式'; // 设置默认值
      
      // 重新获取最新的字典信息，以确保名称是最新的
      const dictionariesData = require('../database/dictionaries.js');
      let displayDictName = selectedDictionaryName;
      
      if (dictionaryId) {
        const currentDict = dictionariesData.dictionaries.find(d => d.id === dictionaryId);
        if (currentDict) {
          displayDictName = currentDict.name;
        }
      }

      if (isStandardMode) {
        // 标准模式只显示课本名称
        currentFilterDisplay = displayDictName || '未知教材';
      } else {
        // 课程模式显示课本名称和课程名称
        const dictName = displayDictName || '未知教材';
        const lessonName = selectedLessonName || '未知课程';
        currentFilterDisplay = `${dictName} - ${lessonName}`;
      }

      return {
        quizMode,
        lessonFiles: selectedLessonFiles,
        dictionaryId,
        basePath,
        allWordsInLesson: words,
        questions,
        totalQuestions: questions.length,
        currentFilterDisplay,
        selectedQuestionTypes: selectedQuestionTypes || ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'],
        isLoading: false,
      };
    } catch (error) {
      console.error('Failed to initialize quiz:', error);
      // 处理错误，例如返回一个空状态或错误提示
      return {
        isLoading: false,
        currentFilterDisplay: '初始化失败', // 确保错误情况下也有有效的currentFilterDisplay
        error: '初始化题目失败，请稍后重试。'
      };
    }
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
   * @param {string} mode - 测验模式 ('quick', 'course', 或 'mistakes')
   * @param {Array} selectedQuestionTypes - 选择的题型
   * @returns {Array} - 最终的问题列表
   */
  selectWordsForQuiz(allWords, mode, selectedQuestionTypes) {
    console.log('selectWordsForQuiz called with:', { wordsCount: allWords.length, questionTypes: selectedQuestionTypes, mode });
    
    // 引入 learnedManager 来判断单词是否已学
    const learnedManager = require('./learnedManager.js');

    if (!selectedQuestionTypes || selectedQuestionTypes.length === 0) {
      selectedQuestionTypes = ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'];
    }

    if (!allWords || allWords.length === 0) {
      return [];
    }

    // 1. 分离已学和未学单词
    const unlearnedWords = allWords.filter(word => {
      // 修复：isWordLearned需要传入wordData和dictionaryId，而不是wordId
      return !learnedManager.isWordLearned(word.data, word.sourceDictionary || 'unknown');
    });
    const learnedWords = allWords.filter(word => {
      // 修复：isWordLearned需要传入wordData和dictionaryId，而不是wordId
      return learnedManager.isWordLearned(word.data, word.sourceDictionary || 'unknown');
    });

    // 2. 根据模式和可用单词数量动态决定题目数量
    let targetQuestionCount;
    if (mode === 'course') {
      // 课程模式：题目数量逻辑优化
      // 1. 先判断剩余未学单词数量
      if (unlearnedWords.length > 0) {
        // 如果有未学单词，则只从未学单词中出题
        // 如果未学单词数量 > 30，则只取30个
        // 如果未学单词数量 <= 30，则取全部
        targetQuestionCount = Math.min(unlearnedWords.length, 30);
      } else {
        // 如果所有单词都已学完（未学为0），则进入复习模式
        // 同样限制最大30题
        targetQuestionCount = Math.min(allWords.length, 30);
      }
    } else if (mode === 'quick') {
      // 快速模式：根据可用单词数量动态决定，最多30题
      targetQuestionCount = Math.min(allWords.length, 30);
    } else {
      // 其他模式（如错题库模式）：使用全部可用单词
      targetQuestionCount = allWords.length;
    }
    
    console.log('Target question count:', targetQuestionCount);
    console.log('Unlearned words:', unlearnedWords.length, 'Learned words:', learnedWords.length);

    // 3. 优先从未学单词中生成问题
    let questionsFromUnlearned = this.generateQuestions(unlearnedWords, selectedQuestionTypes);

    // 4. 根据目标数量组装题目
    let finalQuestions = [];
    
    if (mode === 'course') {
      if (unlearnedWords.length > 0) {
        // 如果有未学单词，只出未学单词的题，且限制数量
        // questionsFromUnlearned 已经是乱序的，直接截取即可
        finalQuestions = questionsFromUnlearned.slice(0, targetQuestionCount);
      } else {
        // 如果没有未学单词（全学会了），进入复习模式
        // 需求：如果这个课程的单词数量小于30个，那么就使用这个课程的全部单词
        // 如果这个课程的全部单词数量大于30个，那么就会选择其中30个组成一次问题
        
        // 重新生成所有单词的题目
        let allQuestions = this.generateQuestions(allWords, selectedQuestionTypes);
        
        // 截取指定数量
        finalQuestions = allQuestions.slice(0, targetQuestionCount);
      }
    } else {
      // 原有逻辑保持不变：未学不足时用已学补充
      if (questionsFromUnlearned.length < targetQuestionCount) {
        const needed = targetQuestionCount - questionsFromUnlearned.length;
        const questionsFromLearned = this.generateQuestions(learnedWords, selectedQuestionTypes);
        const supplement = questionsFromLearned.slice(0, needed);
        finalQuestions = questionsFromUnlearned.concat(supplement);
      } else {
        finalQuestions = questionsFromUnlearned.slice(0, targetQuestionCount);
      }
    }

    // 5. 随机打乱最终的题目顺序
    finalQuestions.sort(() => 0.5 - Math.random());

    console.log('Final questions count:', finalQuestions.length);
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
          // 只有当wordId有效时才添加到集合中
          if (wordId) {
            existingWordIds.add(wordId);
          }
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
   * @returns {string|null} 单词的唯一标识符，如果wordData无效则返回null
   */
  getWordId(wordData) {
    // 增加空值判断，确保wordData有效
    if (!wordData || typeof wordData !== 'object') {
      return null;
    }
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

    // 辅助函数：将片假名转换为平假名
    const katakanaToHiragana = (str) => {
      return str.replace(/[\u30a1-\u30f6]/g, function(match) {
        var chr = match.charCodeAt(0) - 0x60;
        return String.fromCharCode(chr);
      });
    };

    // 辅助函数：将平假名转换为片假名
    const hiraganaToKatakana = (str) => {
      return str.replace(/[\u3041-\u3096]/g, function(match) {
        var chr = match.charCodeAt(0) + 0x60;
        return String.fromCharCode(chr);
      });
    };

    // 辅助函数：标准化假名（统一转换为平假名进行比较）
    const normalizeKana = (str) => {
      if (!str) return '';
      // 移除所有空格
      str = str.replace(/\s+/g, '');
      // 转换为平假名
      return katakanaToHiragana(str);
    };

    const correctAnswerData = currentQuestion.answer;
    
    // 标准化用户答案
    const normalizedUserAnswer = normalizeKana(userAnswerTrimmed);

    if (typeof correctAnswerData === 'object' && correctAnswerData !== null && correctAnswerData.hasOwnProperty('word')) {
      // 填空题（可能是汉字或假名）
      // 检查汉字（如果不为空）
      if (correctAnswerData.word && userAnswerTrimmed === correctAnswerData.word) {
        return true;
      }
      // 检查假名（忽略平片假名区别）
      if (correctAnswerData.kana) {
        const normalizedCorrectKana = normalizeKana(correctAnswerData.kana);
        if (normalizedUserAnswer === normalizedCorrectKana) {
          return true;
        }
      }
      return false;
    } else if (typeof correctAnswerData === 'string') {
      // 可能是假名填空题
      const normalizedCorrectAnswer = normalizeKana(correctAnswerData);
      
      // 直接比较（忽略平片假名区别）
      if (normalizedUserAnswer === normalizedCorrectAnswer) {
        return true;
      }
      
      // 保留原始比较作为后备（针对非假名答案，虽然一般不会走到这里）
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