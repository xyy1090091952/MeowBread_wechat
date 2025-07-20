/**
 * @file 用户等级称号管理器
 * @description 根据已背单词数量统一管理用户等级称号，供多个页面调用
 * @author MeowBread Team
 */

const learnedManager = require('./learnedManager.js');

/**
 * 用户等级称号配置表
 * 根据《用户等级称号系统PRD》文档定义
 */
const USER_TITLE_CONFIG = [
  { threshold: 0, title: '菜鸡', emoji: '🐣', description: '刚开始学习日语的萌新，加油哦！' },
  { threshold: 50, title: '小白兔', emoji: '🐰', description: '已经掌握了一些基础单词，继续努力！' },
  { threshold: 100, title: '新手君', emoji: '🌱', description: '学习态度很认真，正在稳步进步中！' },
  { threshold: 200, title: '努力中', emoji: '📚', description: '词汇量在不断增长，学习很有成效！' },
  { threshold: 400, title: '小有所成', emoji: '🚀', description: '已经积累了不少词汇，日语水平明显提升！' },
  { threshold: 800, title: '老司机', emoji: '🚗', description: '经验丰富的学习者，对日语越来越熟练！' },
  { threshold: 1500, title: '前辈', emoji: '😎', description: '词汇量相当丰富，可以指导新手了！' },
  { threshold: 2200, title: '学霸さん', emoji: '🤓', description: '真正的学霸，日语水平已经很高了！' },
  { threshold: 3200, title: '词汇マスター', emoji: '👑', description: '词汇大师级别，日语功底深厚！' },
  { threshold: 4500, title: '单词の鬼', emoji: '👹', description: '单词之鬼，对日语词汇的掌握令人敬佩！' },
  { threshold: 6000, title: '日语之神', emoji: '⚡', description: '传说级存在，日语水平已达神级！' }
];

/**
 * 根据已背单词数量获取用户等级称号信息
 * @param {number} learnedWordsCount - 已背单词数量
 * @returns {Object} 包含称号、emoji和描述的对象
 */
function getUserTitleInfo(learnedWordsCount = 0) {
  // 从高到低遍历配置，找到符合条件的最高等级
  for (let i = USER_TITLE_CONFIG.length - 1; i >= 0; i--) {
    const config = USER_TITLE_CONFIG[i];
    if (learnedWordsCount >= config.threshold) {
      return {
        title: config.title,
        emoji: config.emoji,
        description: config.description,
        fullTitle: `${config.title} ${config.emoji}`, // 完整称号（含emoji）
        learnedCount: learnedWordsCount,
        threshold: config.threshold,
        nextThreshold: i < USER_TITLE_CONFIG.length - 1 ? USER_TITLE_CONFIG[i + 1].threshold : null
      };
    }
  }
  
  // 默认返回最低等级
  const defaultConfig = USER_TITLE_CONFIG[0];
  return {
    title: defaultConfig.title,
    emoji: defaultConfig.emoji,
    description: defaultConfig.description,
    fullTitle: `${defaultConfig.title} ${defaultConfig.emoji}`,
    learnedCount: learnedWordsCount,
    threshold: defaultConfig.threshold,
    nextThreshold: USER_TITLE_CONFIG[1] ? USER_TITLE_CONFIG[1].threshold : null
  };
}

/**
 * 获取当前用户的等级称号信息
 * 自动统计所有词典的已背单词数量
 * @returns {Object} 用户等级称号信息
 */
function getCurrentUserTitleInfo() {
  try {
    // 获取所有词典的已背单词总数
    const allLearnedWords = learnedManager.getLearnedWords(); // 不传参数获取所有词典
    const totalLearnedCount = allLearnedWords.length;
    
    console.log(`用户总已背单词数: ${totalLearnedCount}`);
    
    return getUserTitleInfo(totalLearnedCount);
  } catch (error) {
    console.error('获取用户等级称号信息失败:', error);
    // 出错时返回默认等级
    return getUserTitleInfo(0);
  }
}

/**
 * 获取指定词典的学习进度和等级信息
 * @param {string} dictionaryId - 词典ID
 * @returns {Object} 包含学习进度和等级信息的对象
 */
function getDictionaryProgressInfo(dictionaryId) {
  try {
    const progressInfo = learnedManager.getLearningProgress(dictionaryId);
    const titleInfo = getUserTitleInfo(progressInfo.learnedCount);
    
    return {
      ...progressInfo,
      titleInfo: titleInfo
    };
  } catch (error) {
    console.error(`获取词典 ${dictionaryId} 进度信息失败:`, error);
    return {
      learnedCount: 0,
      totalCount: 0,
      progress: 0,
      titleInfo: getUserTitleInfo(0)
    };
  }
}

/**
 * 获取所有等级配置（用于显示等级列表等场景）
 * @returns {Array} 等级配置数组
 */
function getAllTitleConfigs() {
  return [...USER_TITLE_CONFIG]; // 返回副本，避免外部修改
}

module.exports = {
  getUserTitleInfo,
  getCurrentUserTitleInfo,
  getDictionaryProgressInfo,
  getAllTitleConfigs,
  USER_TITLE_CONFIG
};