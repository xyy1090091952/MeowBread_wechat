// utils/quizUtils.js
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
}

module.exports = {
  formatQuestion,
  generateOptions,
};