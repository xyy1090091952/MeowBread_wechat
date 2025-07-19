// utils/gashapon-helper.js
// 扭蛋机抽奖逻辑的辅助函数
// 支持防重复抽取和动态概率调整 ✨

const coinManager = require('./coinManager.js');

/**
 * 根据设定的概率从奖池中抽取一个奖品（防重复版本）
 * @param {Array} prizePool - 当前系列的奖池数组
 * @returns {Object} - 抽中的奖品对象，如果没有可抽奖品则返回null
 */
function drawPrize(prizePool) {
  // 获取已解锁的奖品ID列表
  const unlockedIds = coinManager.getUnlockedPrizes() || [];
  
  // 筛选出未获得的奖品
  const availablePrizes = prizePool.filter(prize => !unlockedIds.includes(prize.id));
  
  // 如果没有可抽奖品，返回null
  if (availablePrizes.length === 0) {
    console.log('该系列所有奖品已集齐！');
    return null;
  }
  
  // 按稀有度分组可用奖品
  const availableByRarity = {
    SSR: availablePrizes.filter(prize => prize.rarity === 'SSR'),
    SR: availablePrizes.filter(prize => prize.rarity === 'SR'),
    R: availablePrizes.filter(prize => prize.rarity === 'R'),
    N: availablePrizes.filter(prize => prize.rarity === 'N')
  };
  
  // 基础概率设置
  const baseProbabilities = {
    N: 0.60,   // 60% - 基础奖品
    R: 0.25,   // 25% - 常见奖品  
    SR: 0.10,  // 10% - 稀有奖品
    SSR: 0.05  // 5% - 超稀有奖品
  };
  
  // 动态调整概率：如果某个稀有度没有可用奖品，将其概率分配给其他稀有度
  const adjustedProbabilities = {};
  let totalAvailableProbability = 0;
  
  // 计算有可用奖品的稀有度的总概率
  for (const rarity in baseProbabilities) {
    if (availableByRarity[rarity].length > 0) {
      adjustedProbabilities[rarity] = baseProbabilities[rarity];
      totalAvailableProbability += baseProbabilities[rarity];
    }
  }
  
  // 重新归一化概率，确保总和为1
  for (const rarity in adjustedProbabilities) {
    adjustedProbabilities[rarity] = adjustedProbabilities[rarity] / totalAvailableProbability;
  }
  
  console.log('当前可用奖品分布:', {
    SSR: availableByRarity.SSR.length,
    SR: availableByRarity.SR.length, 
    R: availableByRarity.R.length,
    N: availableByRarity.N.length
  });
  console.log('调整后的概率:', adjustedProbabilities);
  
  // 生成随机数并选择稀有度
  const random = Math.random();
  let cumulativeProbability = 0;
  let selectedRarity = null;
  
  for (const rarity in adjustedProbabilities) {
    cumulativeProbability += adjustedProbabilities[rarity];
    if (random < cumulativeProbability) {
      selectedRarity = rarity;
      break;
    }
  }
  
  // 从选中稀有度的可用奖品中随机选择
  const candidates = availableByRarity[selectedRarity];
  if (candidates && candidates.length > 0) {
    const prizeIndex = Math.floor(Math.random() * candidates.length);
    const selectedPrize = candidates[prizeIndex];
    
    console.log(`抽中了 ${selectedRarity} 级奖品: ${selectedPrize.name}`);
    return selectedPrize;
  }
  
  // 极端情况的兜底逻辑
  console.log('概率计算异常，使用兜底逻辑');
  return availablePrizes[0];
}

/**
 * 检查指定系列是否已经集齐所有奖品
 * @param {Array} prizePool - 当前系列的奖池数组
 * @returns {boolean} - 是否已集齐
 */
function isSeriesCompleted(prizePool) {
  const unlockedIds = coinManager.getUnlockedPrizes() || [];
  const totalPrizes = prizePool.length;
  const unlockedInSeries = prizePool.filter(prize => unlockedIds.includes(prize.id)).length;
  
  return unlockedInSeries >= totalPrizes;
}

/**
 * 获取系列的收集进度信息
 * @param {Array} prizePool - 当前系列的奖池数组
 * @returns {Object} - 包含总数、已收集数、完成率等信息
 */
function getSeriesProgress(prizePool) {
  const unlockedIds = coinManager.getUnlockedPrizes() || [];
  const totalPrizes = prizePool.length;
  const unlockedInSeries = prizePool.filter(prize => unlockedIds.includes(prize.id)).length;
  
  return {
    total: totalPrizes,
    unlocked: unlockedInSeries,
    remaining: totalPrizes - unlockedInSeries,
    completionRate: Math.round((unlockedInSeries / totalPrizes) * 100)
  };
}

// 导出抽奖函数和辅助函数
module.exports = {
  drawPrize,
  isSeriesCompleted,
  getSeriesProgress
};