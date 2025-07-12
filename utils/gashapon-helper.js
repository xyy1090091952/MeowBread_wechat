// utils/gashapon-helper.js
// 扭蛋机抽奖逻辑的辅助函数

/**
 * 根据设定的概率从奖池中抽取一个奖品
 * @param {Array} prizePool - 当前系列的奖池数组
 * @returns {Object} - 抽中的奖品对象
 */
function drawPrize(prizePool) {
  // 1. 定义不同稀有度的概率
  const probabilities = {
    SSR: 0.05, // 5%
    SR: 0.15,  // 15%
    R: 0.80,   // 80%
  };

  // 2. 生成一个0到1之间的随机数
  const random = Math.random();
  let cumulativeProbability = 0;

  let selectedRarity;

  // 3. 根据随机数判断抽中了哪个稀有度
  for (const rarity in probabilities) {
    cumulativeProbability += probabilities[rarity];
    if (random < cumulativeProbability) {
      selectedRarity = rarity;
      break;
    }
  }

  // 4. 从对应稀有度的奖品中随机抽取一个
  // 筛选出所有符合选中稀有度的奖品
  const candidates = prizePool.filter(prize => prize.rarity === selectedRarity);

  // 如果该稀有度下有奖品
  if (candidates.length > 0) {
    // 从候选奖品中随机选择一个
    const prizeIndex = Math.floor(Math.random() * candidates.length);
    return candidates[prizeIndex];
  } else {
    // 极端情况：如果某个稀有度没有配置奖品，则默认返回R级的第一个奖品，保证程序健壮性
    const fallbackCandidates = prizePool.filter(prize => prize.rarity === 'R');
    return fallbackCandidates[0];
  }
}

// 导出抽奖函数
module.exports = {
  drawPrize: drawPrize
};