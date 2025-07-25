// 课程数据管理器
// 用于管理课程信息和计算单词总量
const dictionariesData = require('../database/dictionaries.js');

class CourseDataManager {
  constructor() {
    // 从 dictionaries.js 初始化教材数据
    this.textbooks = dictionariesData.dictionaries.reduce((acc, dict) => {
      acc[dict.id] = dict;
      return acc;
    }, {});
  }

  /**
   * 获取指定教材的课程信息
   * @param {string} textbookId - 教材ID
   * @returns {Object|null} 课程信息对象
   */
  getTextbookInfo(textbookId) {
    return this.textbooks[textbookId] || null;
  }

  /**
   * 获取指定教材的所有课程列表
   * @param {string} textbookId - 教材ID
   * @returns {Array} 课程列表
   */
  getCourseList(textbookId) {
    const textbookInfo = this.getTextbookInfo(textbookId);
    return textbookInfo ? textbookInfo.courses : [];
  }

  /**
   * 根据课程编号获取课程信息
   * @param {string} textbookId - 教材ID
   * @param {number} courseNumber - 课程编号
   * @returns {Object|null} 课程信息
   */
  getCourseInfo(textbookId, courseNumber) {
    const courseList = this.getCourseList(textbookId);
    return courseList.find(course => course.courseNumber === courseNumber) || null;
  }

  /**
   * 获取指定课程的单词总量
   * @param {string} textbookId - 教材ID
   * @param {number} courseNumber - 课程编号
   * @returns {number} 单词总量
   */
  async getCourseWordCount(textbookId, courseNumber) {
    try {
      const courseInfo = this.getCourseInfo(textbookId, courseNumber);
      if (!courseInfo || !courseInfo.lessonFile) return 0;

      // 使用 wordManager 异步获取单词
      const wordManager = require('./wordManager.js');
      const words = await wordManager.getWordsByFilter({ lessonFiles: [courseInfo.lessonFile], dictionaryId: textbookId });
      return words.length;
    } catch (error) {
      console.error(`获取课程单词数量失败: ${textbookId} - ${courseNumber}`, error);
      return 0;
    }
  }

  /**
   * 获取课程详细信息（包含单词数量）
   * @param {string} textbookId - 教材ID
   * @param {number} courseNumber - 课程编号
   * @returns {Object|null} 课程详细信息
   */
  async getCourseDetails(textbookId, courseNumber) {
    const textbookInfo = this.getTextbookInfo(textbookId);
    if (!textbookInfo) return null;

    const courseInfo = this.getCourseInfo(textbookId, courseNumber);
    if (!courseInfo) return null;

    const wordCount = await this.getCourseWordCount(textbookId, courseNumber);

    return {
      ...courseInfo,
      wordCount: wordCount,
      textbook: textbookId,
      textbookName: textbookInfo.name
    };
  }

  /**
   * 获取教材的所有课程详细信息
   * @param {string} textbookId - 教材ID
   * @returns {Array} 课程详细信息列表
   */
  async getAllCourseDetails(textbookId) {
    const courseList = this.getCourseList(textbookId);
    // 使用 Promise.all 并发获取所有课程的详细信息
    return Promise.all(courseList.map(course => this.getCourseDetails(textbookId, course.courseNumber)));
  }

  /**
   * 获取支持的教材列表
   * @returns {Array} 教材列表
   */
  getSupportedTextbooks() {
    return Object.values(this.textbooks).map(textbook => ({
      key: textbook.id,
      name: textbook.name
    }));
  }

  /**
   * 获取指定教材的分册信息
   * @param {string} textbookId - 教材ID
   * @returns {Array} 分册列表
   */
  getTextbookVolumes(textbookId) {
    const textbookInfo = this.getTextbookInfo(textbookId);
    return textbookInfo ? textbookInfo.volumes : [];
  }

  /**
   * 获取指定教材和分册的课程列表
   * @param {string} textbookId - 教材ID
   * @param {string} volumeId - 分册ID
   * @returns {Array} 课程列表
   */
  getCoursesByVolume(textbookId, volumeId) {
    const volumes = this.getTextbookVolumes(textbookId);
    const volume = volumes.find(v => v.id === volumeId);
    if (!volume) return [];

    const courseList = this.getCourseList(textbookId);
    return courseList.filter(course => volume.lessons.includes(course.courseNumber));
  }

  /**
   * 获取指定教材和分册的课程详细信息
   * @param {string} textbookId - 教材ID
   * @param {string} volumeId - 分册ID
   * @returns {Array} 课程详细信息列表
   */
  async getCourseDetailsByVolume(textbookId, volumeId) {
    if (volumeId === 'all' || !volumeId) {
      // 直接返回异步调用的结果
      return await this.getAllCourseDetails(textbookId);
    }
    const courseList = this.getCoursesByVolume(textbookId, volumeId);
    // 使用 Promise.all 来处理 map 中的异步调用
    return Promise.all(courseList.map(course => this.getCourseDetails(textbookId, course.courseNumber)));
  }

  /**
   * 根据课程编号获取所属分册信息
   * @param {string} textbookId - 教材ID
   * @param {number} courseNumber - 课程编号
   * @returns {Object|null} 分册信息
   */
  getVolumeForCourse(textbookId, courseNumber) {
    const volumes = this.getTextbookVolumes(textbookId);
    return volumes.find(volume => volume.lessons.includes(courseNumber)) || null;
  }
}

module.exports = new CourseDataManager();