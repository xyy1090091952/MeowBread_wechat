const wordManager = require('./wordManager.js');
const learnedManager = require('./learnedManager.js');

// Both entries use the same dictionary and word identities; priority is only a view.
async function buildCoursePracticeRows(courseList, textbook) {
  const groups = await Promise.all(courseList.map(async course => {
    const words = await wordManager.getWordsByFilter({
      dictionaryId: textbook, lessonFiles: [course.lessonFile]
    });
    const makeRow = (pool, priorityOnly) => {
      const learnedCount = pool.filter(word => learnedManager.isWordLearned(word.data, textbook)).length;
      const totalWords = pool.length;
      return {
        courseNumber: course.courseNumber,
        courseTitle: priorityOnly ? `第${course.courseNumber}课 · 重点词汇` : course.courseTitle,
        description: priorityOnly ? '' : course.description,
        progressLabel: priorityOnly ? '重点词进度' : '单词进度',
        practiceKey: `${course.courseNumber}-${priorityOnly ? 'priority' : 'all'}`,
        priorityOnly,
        learnedCount,
        totalWords,
        progress: totalWords > 0 ? Math.round(learnedCount / totalWords * 100) : 0,
        isCompleted: totalWords > 0 && learnedCount === totalWords,
        textbook,
        lessonFile: course.lessonFile
      };
    };
    const rows = [makeRow(words, false)];
    const priorityWords = words.filter(word => word.data.重点 === true);
    if (priorityWords.length > 0) rows.push(makeRow(priorityWords, true));
    return rows;
  }));
  return { courseData: groups.map(rows => rows[0]), courseRows: [].concat(...groups) };
}

module.exports = { buildCoursePracticeRows };
