// utils/quizUtils.js
/**
 * @file 答题页面的工具函数 (出题工具箱)
 * @description 
 *   职责：提供一系列与答题相关的、可复用的、无状态的辅助函数，例如格式化题目、生成选项等。
 *   特点：原子化，每个函数只做一件具体的事，不涉及业务流程，不依赖其他模块的状态。
 *   比喻：一个“出题工具箱”，提供了各种出题所需的工具（如格式化、选项生成），供“考官”(`quiz.service.js`)使用。
 */
const { QUESTION_TYPES } = require('./constants.js');

/**
 * 根据指定的题型格式化单个单词为题目对象
 * @param {object} wordData - 包含单词信息的对象，结构为 { data: { ... }, sourceDictionary: '...', lesson: '...' }
 * @param {string} questionTypeToGenerate - 要生成的题型，来自 QUESTION_TYPES
 * @param {Array<object>} allWordsInLesson - 用于生成选项的整个单词池
 * @returns {object|null} - 格式化后的题目对象，或在无法生成时返回 null
 */
function formatQuestion(wordData, questionTypeToGenerate, allWordsInLesson) {
  const word = wordData.data;
  if (!word || !word.中文 || (!word.汉字 && !word.假名)) {
    console.warn('formatQuestion: 无效的单词数据或缺少必要字段:', wordData);
    return null;
  }

  let questionText = '', correctAnswer = '', options = [], actualQuestionType = '', wordToDisplay = '', stemRemainder = '';
  const japaneseForm = word.汉字 || word.假名;
  const chineseMeaning = word.中文;

  switch (questionTypeToGenerate) {
    case QUESTION_TYPES.ZH_TO_JP_CHOICE:
      questionText = `「${chineseMeaning}」的日语是什么？`;
      correctAnswer = japaneseForm;
      actualQuestionType = 'choice';
      options = generateOptions(wordData, 'japanese', allWordsInLesson);
      wordToDisplay = `「${chineseMeaning}」`;
      stemRemainder = '的日语是什么？';
      break;
    case QUESTION_TYPES.JP_TO_ZH_CHOICE:
      questionText = `「${japaneseForm}」的中文意思是什么？`;
      correctAnswer = chineseMeaning;
      actualQuestionType = 'choice';
      options = generateOptions(wordData, 'chinese', allWordsInLesson);
      wordToDisplay = `「${japaneseForm}」`;
      stemRemainder = '的中文意思是什么？';
      break;
    case QUESTION_TYPES.ZH_TO_JP_FILL:
      questionText = `「${chineseMeaning}」的日语是？(可填汉字或假名)`;
      correctAnswer = { word: word.汉字, kana: word.假名 };
      actualQuestionType = 'fill';
      wordToDisplay = `「${chineseMeaning}」`;
      stemRemainder = '的日语是？(可填汉字或假名)';
      break;
    case QUESTION_TYPES.JP_KANJI_TO_KANA_FILL:
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
    type: actualQuestionType,
    wordToDisplay: wordToDisplay,
    stemRemainder: stemRemainder,
    answer: correctAnswer,
    options: options,
    wordInfo: word,
    partOfSpeech: word.词性 || '',
    specificQuestionType: questionTypeToGenerate
  };
}

/**
 * 为选择题生成选项列表
 * @param {object} correctWordData - 正确答案的单词对象
 * @param {string} optionType - 'japanese' 或 'chinese'，决定选项是日语还是中文
 * @param {Array<object>} allWordsInLesson - 用于生成干扰项的整个单词池
 * @returns {Array<string>} - 包含一个正确答案和三个干扰项的随机排序数组
 */
function generateOptions(correctWordData, optionType, allWordsInLesson) {
  const correctWord = correctWordData.data;
  let correctAnswerText = '';
  let predefinedDistractors = [];

  // 确定正确答案和预设的干扰项来源
  if (optionType === 'chinese') {
    correctAnswerText = correctWord.中文;
    predefinedDistractors = correctWord.中文干扰词 || [];
  } else {
    correctAnswerText = correctWord.汉字 || correctWord.假名;
    predefinedDistractors = correctWord.日语干扰词 || [];
  }

  let options = [correctAnswerText];

  // 优先使用预设干扰项
  // 筛选出不与正确答案重复的有效干扰项
  let validPredefinedDistractors = predefinedDistractors.filter(d => d && d !== correctAnswerText);
  // 打乱顺序
  validPredefinedDistractors.sort(() => 0.5 - Math.random());

  // 从有效预设干扰项中提取最多3个，且不能与已有的选项重复
  for (const distractor of validPredefinedDistractors) {
    if (options.length >= 4) break;
    if (!options.includes(distractor)) {
      options.push(distractor);
    }
  }

  // 如果选项不足4个，则使用备用逻辑从整个课程词库中补充
  if (options.length < 4) {
    const fallbackPool = allWordsInLesson.filter(w => {
      const wData = w.data;
      const wText = (optionType === 'chinese') ? wData.中文 : (wData.汉字 || wData.假名);
      // 确保备用选项有效、不与正确答案重复、且不包含在已选的选项中
      return wText && wText !== correctAnswerText && !options.includes(wText);
    });

    // 打乱备用池
    fallbackPool.sort(() => 0.5 - Math.random());

    // 补充选项直到满4个
    while (options.length < 4 && fallbackPool.length > 0) {
      const distractorWord = fallbackPool.shift().data;
      const distractorText = (optionType === 'chinese') ? distractorWord.中文 : (distractorWord.汉字 || distractorWord.假名);
      // 再次检查，避免在并发或复杂情况下加入重复项
      if (distractorText && !options.includes(distractorText)) {
        options.push(distractorText);
      }
    }
  }

  // 最后再次随机排序所有选项
  return options.sort(() => 0.5 - Math.random());
}

module.exports = {
  formatQuestion,
  generateOptions,
};