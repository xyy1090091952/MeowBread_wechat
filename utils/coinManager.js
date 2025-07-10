// utils/coinManager.js

/**
 * coinManager.js
 * 
 * 本模块负责统一管理用户的核心数据，包括金币数量和已解锁的奖品列表。
 * 它封装了数据的读取、写入和更新逻辑，并处理本地缓存，确保数据在整个小程序中的一致性和持久性。
 * 
 * 主要功能:
 * 1. 初始化用户数据：为新用户设置初始金币和空的奖品列表。
 * 2. 数据读取：提供获取用户金币总数和已解锁奖品列表的接口。
 * 3. 数据更新：
 *    - 提供安全增加或减少金币的原子操作。
 *    - 提供添加新奖品到用户收藏的接口。
 * 4. 数据持久化：所有数据变更都会实时同步到微信小程序的本地缓存中。
 * 
 * 设计理念:
 * - 单一数据源：所有与金币和奖品相关的数据操作都应通过本模块进行，避免数据状态的分散和不一致。
 * - 数据抽象：将数据存储和管理的具体实现（如wx.getStorageSync, wx.setStorageSync）封装起来，
 *   上层业务逻辑无需关心底层存储细节。
 * - 原子操作：对于金币这类数值的修改，提供增减接口而非直接设置，便于追踪和防止意外覆盖。
 */

const STORAGE_KEY = 'userData'; // 定义本地缓存中使用的键名，方便管理
const INITIAL_COINS = 500; // 定义新用户的初始金币数量

/**
 * 初始化用户数据
 * 如果缓存中没有用户数据，则创建一个新的数据结构并存入缓存
 */
const initializeUserData = () => {
  const userData = wx.getStorageSync(STORAGE_KEY);
  if (!userData) {
    wx.setStorageSync(STORAGE_KEY, {
      coins: INITIAL_COINS,
      unlockedPrizes: [],
    });
  }
};

/**
 * 获取当前用户的全部数据
 * @returns {object} 包含coins和unlockedPrizes的对象
 */
const getUserData = () => {
  let userData = wx.getStorageSync(STORAGE_KEY);
  if (!userData) {
    initializeUserData(); // 如果数据不存在，先初始化
    userData = wx.getStorageSync(STORAGE_KEY); // 重新获取
  }
  return userData;
};

/**
 * 获取当前用户的金币数量
 * @returns {number} 当前金币数
 */
const getCoins = () => {
  return getUserData().coins;
};

/**
 * 增加用户的金币数量
 * @param {number} amount - 要增加的金币数量，必须是正数
 */
const addCoins = (amount) => {
  if (typeof amount !== 'number' || amount <= 0) {
    console.error('addCoins: amount must be a positive number.');
    return;
  }
  const userData = getUserData();
  userData.coins += amount;
  wx.setStorageSync(STORAGE_KEY, userData);
};

/**
 * 减少用户的金币数量
 * @param {number} amount - 要减少的金币数量，必须是正数
 * @returns {boolean} - 如果金币足够，则扣除并返回true；否则返回false
 */
const spendCoins = (amount) => {
  if (typeof amount !== 'number' || amount <= 0) {
    console.error('spendCoins: amount must be a positive number.');
    return false;
  }
  const userData = getUserData();
  if (userData.coins >= amount) {
    userData.coins -= amount;
    wx.setStorageSync(STORAGE_KEY, userData);
    return true;
  }
  return false;
};

/**
 * 获取用户已解锁的奖品ID列表
 * @returns {Array<number>} 奖品ID数组
 */
const getUnlockedPrizes = () => {
  return getUserData().unlockedPrizes;
};

/**
 * 添加一个新的奖品到用户的收藏中
 * @param {string | number} prizeId - 要添加的奖品ID，可以是字符串或数字
 */
const addUnlockedPrize = (prizeId) => {
  // 奖品ID可以是字符串（如 'FX-SSR-01'）或数字，因此检查它不为空即可
  if (!prizeId) {
    console.error('addUnlockedPrize: prizeId cannot be null or empty.');
    return;
  }
  const userData = getUserData();
  // 检查是否已经解锁，避免重复添加
  if (!userData.unlockedPrizes.includes(prizeId)) {
    userData.unlockedPrizes.push(prizeId);
    wx.setStorageSync(STORAGE_KEY, userData);
  }
};

// 导出所有公共方法
module.exports = {
  initializeUserData,
  getCoins,
  addCoins,
  spendCoins,
  getUnlockedPrizes,
  addUnlockedPrize,
};