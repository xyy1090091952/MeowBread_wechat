// 课程数据管理器
// 用于管理课程信息和计算单词总量

const liangsCourseInfo = require('../database/liangs_class/course_info.js');
const duolinguoCourseInfo = require('../database/duolingguo/course_info.js');
const everyonesCourseInfo = require('../database/everyones_japanese/course_info.js');

class CourseDataManager {
  constructor() {
    // 支持的教材列表
    this.textbooks = {
      'liangs_class': liangsCourseInfo,
      'duolingguo': duolinguoCourseInfo,
      'everyones_japanese': everyonesCourseInfo
    };
  }

  /**
   * 获取指定教材的课程信息
   * @param {string} textbook - 教材名称
   * @returns {Object|null} 课程信息对象
   */
  getTextbookInfo(textbook) {
    return this.textbooks[textbook] || null;
  }

  /**
   * 获取指定教材的所有课程列表
   * @param {string} textbook - 教材名称
   * @returns {Array} 课程列表
   */
  getCourseList(textbook) {
    const textbookInfo = this.getTextbookInfo(textbook);
    return textbookInfo ? textbookInfo.courses : [];
  }

  /**
   * 获取指定课程的单词总量
   * @param {string} textbook - 教材名称
   * @param {number} courseNumber - 课程编号
   * @returns {number} 单词总量
   */
  getCourseWordCount(textbook, courseNumber) {
    try {
      const textbookInfo = this.getTextbookInfo(textbook);
      if (!textbookInfo) return 0;

      const courseInfo = textbookInfo.getCourseInfo(courseNumber);
      if (!courseInfo) return 0;

      // 动态加载对应的lesson文件
      const lessonData = require(`../database/${textbook}/${courseInfo.lessonFile}.js`);
      return lessonData.length;
    } catch (error) {
      console.error(`获取课程单词数量失败: ${textbook} - ${courseNumber}`, error);
      return 0;
    }
  }

  /**
   * 获取课程详细信息（包含单词数量）
   * @param {string} textbook - 教材名称
   * @param {number} courseNumber - 课程编号
   * @returns {Object|null} 课程详细信息
   */
  getCourseDetails(textbook, courseNumber) {
    const textbookInfo = this.getTextbookInfo(textbook);
    if (!textbookInfo) return null;

    const courseInfo = textbookInfo.getCourseInfo(courseNumber);
    if (!courseInfo) return null;

    const wordCount = this.getCourseWordCount(textbook, courseNumber);

    return {
      ...courseInfo,
      wordCount: wordCount,
      textbook: textbook,
      textbookName: textbookInfo.textbookName
    };
  }

  /**
   * 获取教材的所有课程详细信息
   * @param {string} textbook - 教材名称
   * @returns {Array} 课程详细信息列表
   */
  getAllCourseDetails(textbook) {
    const courseList = this.getCourseList(textbook);
    return courseList.map(course => this.getCourseDetails(textbook, course.courseNumber));
  }

  /**
   * 获取支持的教材列表
   * @returns {Array} 教材列表
   */
  getSupportedTextbooks() {
    return Object.keys(this.textbooks).map(key => ({
      key: key,
      name: this.textbooks[key].textbookName
    }));
  }

  /**
   * 获取指定教材的分册信息
   * @param {string} textbook - 教材名称
   * @returns {Array} 分册列表
   */
  getTextbookVolumes(textbook) {
    const textbookInfo = this.getTextbookInfo(textbook);
    return textbookInfo ? textbookInfo.getVolumes() : [];
  }

  /**
   * 获取指定教材和分册的课程列表
   * @param {string} textbook - 教材名称
   * @param {string} volumeKey - 分册key
   * @returns {Array} 课程列表
   */
  getCoursesByVolume(textbook, volumeKey) {
    const textbookInfo = this.getTextbookInfo(textbook);
    return textbookInfo ? textbookInfo.getCoursesByVolume(volumeKey) : [];
  }

  /**
   * 获取指定教材和分册的课程详细信息
   * @param {string} textbook - 教材名称
   * @param {string} volumeKey - 分册key
   * @returns {Array} 课程详细信息列表
   */
  getCourseDetailsByVolume(textbook, volumeKey) {
    const courseList = this.getCoursesByVolume(textbook, volumeKey);
    return courseList.map(course => this.getCourseDetails(textbook, course.courseNumber));
  }

  /**
   * 根据课程编号获取所属分册信息
   * @param {string} textbook - 教材名称
   * @param {number} courseNumber - 课程编号
   * @returns {Object|null} 分册信息
   */
  getVolumeForCourse(textbook, courseNumber) {
    const textbookInfo = this.getTextbookInfo(textbook);
    return textbookInfo ? textbookInfo.getVolumeForCourse(courseNumber) : null;
  }
}

module.exports = new CourseDataManager(); 