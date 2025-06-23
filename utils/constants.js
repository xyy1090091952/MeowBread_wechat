/**
 * @file 应用常量定义
 * @description 该文件包含了整个小程序中广泛使用的常量，例如单词状态、题目类型等，旨在确保代码的一致性和可维护性。
 * @author MeowBread Team
 */

/**
 * @const {object} WORD_STATUS
 * @description 定义单词学习状态的常量集合。
 * @property {string} UNSEEN - 'unseen'，表示单词尚未被学习或在任何测验中出现。
 * @property {string} ERROR - 'error'，表示用户在测验中答错了该单词。
 * @property {string} CORRECTED - 'corrected'，表示单词曾被答错，但之后在错题重练中被答对。
 * @property {string} MEMORIZED - 'memorized'，表示用户已掌握该单词，例如通过手动标记或多次正确回答。
 */
const WORD_STATUS = {
  UNSEEN: 'unseen',
  ERROR: 'error',
  CORRECTED: 'corrected',
  MEMORIZED: 'memorized',
};

/**
 * 题型常量
 * 用于定义所有支持的题目类型
 */
const QUESTION_TYPES = {
  // 中文选日文（选择题）
  ZH_TO_JP_CHOICE: 'zh_to_jp_choice',
  // 日文选中文（选择题）
  JP_TO_ZH_CHOICE: 'jp_to_zh_choice',
  // 中文填日文（填空题）
  ZH_TO_JP_FILL: 'zh_to_jp_fill',
  // 日文汉字填假名（填空题）
  JP_KANJI_TO_KANA_FILL: 'jp_kanji_to_kana_fill',
};

module.exports = {
  WORD_STATUS,
  QUESTION_TYPES,
};