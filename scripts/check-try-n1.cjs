// Validate the bundled lesson and exercise the real quiz/data modules with wx mocks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const lesson = require('../database/try_n1/lesson1.js');
const db = require('../database/dictionaries.js');
const { QUESTION_TYPES } = require('../utils/constants.js');
const config = db.dictionaries.find(d => d.id === 'try_n1');
assert(config);
assert.equal(db.dictionaries[0].id, 'try_n2', 'Do not change the default textbook');
assert.deepEqual(config.volumes[0].lessons, [1]);
assert.equal(config.courses.length, 1);
assert.equal(config.lesson_files.length, 1);
assert.equal(config.courses[0].lessonFile, config.lesson_files[0]);
assert(fs.existsSync(path.join(root, config.cover_image)));
assert.equal(lesson.length, 91);
assert.equal(lesson.filter(w => w.data.重点).length, 50);
const required = ['假名', '汉字', '中文', '例句', '词性', '日语干扰词', '中文干扰词', '重点'];
const seen = new Set();
for (const { data } of lesson) {
  assert.deepEqual(Object.keys(data).sort(), [...required].sort());
  assert.equal(typeof data.重点, 'boolean');
  const key = data.汉字 || data.假名;
  assert(!seen.has(key), `Duplicate word: ${key}`);
  seen.add(key);
  for (const f of ['假名', '中文', '例句', '词性']) assert(data[f].trim(), `${key}: ${f}`);
  assert(data.例句.endsWith('。'));
  assert(data.例句.includes(key), `${key}: example must contain dictionary form`);
  for (const f of ['日语干扰词', '中文干扰词']) {
    const items = data[f];
    assert.equal(items.length, 6, key);
    assert.equal(new Set(items).size, 6, key);
    assert(items.every(x => typeof x === 'string' && x.trim()), key);
    assert(!items.includes(f === '中文干扰词' ? data.中文 : key), key);
  }
}
const canonical = process.argv[2];
if (canonical) {
  assert.deepEqual(JSON.parse(fs.readFileSync(canonical, 'utf8')), lesson, 'Bundled copy differs from canonical lesson');
  const folder = path.dirname(canonical);
  const priorityFile = path.join(path.dirname(folder), 'dictionary_maker/try_n1_priority_words.json');
  const priorityList = JSON.parse(fs.readFileSync(priorityFile, 'utf8'));
  const chapter = priorityList.lessons.find(l => l.lessonNumber === 1);
  const expectedPriority = chapter.sections.flatMap(section => section.words.map(w => w.wordKey)).sort();
  const actualPriority = lesson.filter(w => w.data.重点).map(({ data }) => {
    const word = data.汉字 || data.假名;
    return word === '寛容な' ? '寛容' : word.replace(/する$/, '');
  }).sort();
  assert.deepEqual(actualPriority, expectedPriority, 'Priority flags must match the source chapter exactly');
  for (let n = 2; n <= 15; n++) assert.deepEqual(JSON.parse(fs.readFileSync(path.join(folder, `lesson${n}.json`), 'utf8')), []);
}
const storage = new Map([
  ['word_count_cache_try_n1', 85],
  ['word_cache_version', '1.0.0'],
  ['word_cache_try_n1_lesson1.json', lesson.slice(0, 85).map(w => ({ data: { ...w.data, 重点: undefined } }))],
  ['word_cache_try_n1_lesson1.json_timestamp', Date.now()],
]);
let networkCalls = [];
global.wx = {
  getStorageSync: key => storage.get(key),
  setStorageSync: (key, value) => storage.set(key, value),
  removeStorageSync: key => storage.delete(key),
  getStorageInfoSync: () => ({ keys: [...storage.keys()] }),
  getDeviceInfo: () => ({ platform: 'test' }),
  request: options => {
    networkCalls.push(options.url);
    options.success({ statusCode: 200, data: [{ data: { 假名: 'テスト', 汉字: '', 中文: '测试' } }] });
  },
};
const manager = require('../utils/wordManager.js');
const quiz = require('../utils/quiz.service.js');
const utils = require('../utils/quizUtils.js');
const { requestLesson } = require('../utils/lessonData.js');
(async () => {
  const url = config.lesson_files[0];
  for (const identifier of [url, 'DICTIONARY_try_n1_ALL_LESSONS', 'DICTIONARY_try_n1_lesson1']) {
    const words = await manager.getWordsByFilter({ dictionaryId: 'try_n1', lessonFiles: [identifier] });
    assert.equal(words.length, 91, identifier);
    assert.equal(words.filter(w => w.data.重点).length, 50, 'Bundled priority flags must override the old cache');
    assert(words.every(w => w.sourceDictionary === 'try_n1' && w.lesson === 1));
  }
  assert.equal(await manager.getDictionaryWordCount('try_n1'), 91);
  assert.equal(networkCalls.length, 0, 'N1 must work before publishing the remote data');
  const words = lesson.map(w => ({ ...w, sourceDictionary: 'try_n1', lesson: 1 }));
  const counts = {};
  for (const type of Object.values(QUESTION_TYPES)) {
    let count = 0;
    for (const w of words) {
      // Repeated random choices must stay unique and retain the correct answer.
      for (let attempt = 0; attempt < 10; attempt++) {
        const q = utils.formatQuestion(w, type, words);
        if (type === QUESTION_TYPES.JP_KANJI_TO_KANA_FILL && !w.data.汉字) { assert.equal(q, null); continue; }
        assert(q, `${type}: ${w.data.假名}`);
        assert.equal(q.isPriority, w.data.重点);
        if (q.type === 'choice') {
          assert.equal(q.options.length, 4);
          assert.equal(new Set(q.options).size, 4);
          assert.equal(q.options.filter(x => x === q.answer).length, 1);
          assert(quiz.checkAnswer(q, q.answer));
          for (const wrong of q.options.filter(x => x !== q.answer)) assert(!quiz.checkAnswer(q, wrong));
        } else {
          assert(quiz.checkAnswer(q, w.data.假名));
          if (type === QUESTION_TYPES.ZH_TO_JP_FILL && w.data.汉字) assert(quiz.checkAnswer(q, w.data.汉字));
          assert(!quiz.checkAnswer(q, '这不是答案'));
        }
      }
      const q = utils.formatQuestion(w, type, words);
      if (q) count++;
    }
    counts[type] = count;
    assert.equal(quiz.generateQuestions(words, [type]).length, count);
  }
  // Exercise the actual course entries, shared progress and navigation filter.
  const { buildCoursePracticeRows } = require('../utils/coursePractice.js');
  const learned = require('../utils/learnedManager.js');
  const filterManager = require('../utils/filterManager.js');
  let rows = await buildCoursePracticeRows(config.courses, 'try_n1');
  assert.equal(rows.courseData.length, 1, 'Priority practice must not count as another course');
  assert.deepEqual(rows.courseRows.map(row => row.totalWords), [91, 50]);
  const priority = lesson.find(word => word.data.重点).data;
  const ordinary = lesson.find(word => !word.data.重点).data;
  // Old stored word data need not contain the newer priority field.
  learned.markWordAsLearned({ ...priority, 重点: undefined }, 'try_n1');
  learned.markWordAsLearned(ordinary, 'try_n1');
  rows = await buildCoursePracticeRows(config.courses, 'try_n1');
  assert.deepEqual(rows.courseRows.map(row => row.learnedCount), [2, 1]);
  let coursePage;
  global.Page = definition => { coursePage = definition; };
  require('../pages/course-mode/course-mode.js');
  delete global.Page;
  wx.navigateTo = () => {};
  const page = { data: rows, setData(update) { Object.assign(this.data, update); } };
  for (const priorityOnly of [true, false]) {
    const row = rows.courseRows.find(row => row.priorityOnly === priorityOnly);
    coursePage.onQuizTap.call(page, { currentTarget: { dataset: { course: row } } });
    assert.equal(filterManager.getFilter().priorityOnly, priorityOnly);
    const state = await quiz.initializeQuiz({ mode: 'course' });
    assert.equal(state.allWordsInLesson.length, priorityOnly ? 50 : 91);
    assert(state.questions.length > 0);
    assert.equal(state.dictionaryId, 'try_n1', 'Use the original progress namespace');
    if (priorityOnly) assert(state.questions.every(question => question.isPriority));
    assert(!state.questions.some(question => quiz.getWordId(question.wordInfo) === quiz.getWordId(priority)), 'Prefer unlearned words');
  }
  learned.unmarkWordAsLearned(priority, 'try_n1');
  rows = await buildCoursePracticeRows(config.courses, 'try_n1');
  assert.deepEqual(rows.courseRows.map(row => row.learnedCount), [1, 0]);
  storage.set('learned_words_try_n1', lesson.filter(word => word.data.重点).map(word => ({ id: quiz.getWordId(word.data), wordData: word.data })));
  rows = await buildCoursePracticeRows(config.courses, 'try_n1');
  assert.deepEqual(rows.courseRows.map(row => row.isCompleted), [false, true]);
  coursePage.onQuizTap.call(page, { currentTarget: { dataset: { course: rows.courseRows[1] } } });
  const review = await quiz.initializeQuiz({ mode: 'course' });
  assert.equal(review.questions.length, 30);
  assert(review.questions.every(question => question.isPriority), 'Completed priority review must stay in the priority pool');
  storage.delete('learned_words_try_n1');
  const oldUrl = db.dictionaries.find(d => d.id === 'try_n2').lesson_files[0];
  const noPriorityRows = await buildCoursePracticeRows([{ courseNumber: 1, courseTitle: '第1课', lessonFile: oldUrl }], 'try_n2');
  assert.equal(noPriorityRows.courseRows.length, 1, 'Do not show an empty priority entry');
  networkCalls = [];
  await new Promise(resolve => requestLesson({ url: oldUrl, success: res => { assert.equal(res.statusCode, 200); resolve(); } }));
  assert.deepEqual(networkCalls, [oldUrl], 'Existing dictionaries must keep using wx.request');
  const oldWord = { data: { 假名: 'テスト', 汉字: '', 中文: '测试' } };
  assert.equal(utils.formatQuestion(oldWord, QUESTION_TYPES.ZH_TO_JP_FILL, [oldWord]).isPriority, false);
  console.log('PASS: 91 words, 50 priority flags, stale-cache recovery, four question types and answer grading.');
  console.log(counts);
})().catch(error => { console.error(error); process.exitCode = 1; });
