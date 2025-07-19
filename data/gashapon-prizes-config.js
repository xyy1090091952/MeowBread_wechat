// data/gashapon-prizes-config.js
// 扭蛋奖品数据配置文件 - 统一管理所有奖品信息
// 主人专用的奖品数据库 ✨

/**
 * 奖品数据结构定义
 * @typedef {Object} Prize
 * @property {string} id - 奖品唯一标识符
 * @property {string} name - 奖品名称
 * @property {string} rarity - 稀有度 (SSR/SR/R/N)
 * @property {string} image - 奖品图片路径
 * @property {string} quote - 奖品简介/描述
 */

/**
 * 扭蛋系列数据结构定义
 * @typedef {Object} GashaponSeries
 * @property {number} id - 系列唯一标识符
 * @property {string} name - 系列名称
 * @property {number} cost - 抽奖消耗金币
 * @property {string} gradientType - 卡片背景渐变类型
 * @property {string} image - 系列装饰图片
 * @property {Prize[]} prizes - 奖品列表
 */

// 🌟 梦幻魔法系列奖品
const magicPrizes = [
  // SSR 级别
  { 
    id: 'FX-SSR-01', 
    name: '玫瑰魔法', 
    rarity: 'SSR', 
    image: '/images/gashapon/prizes/FX-SSR-01.png', 
    quote: '阿姨洗铁路' 
  },
  // SR 级别
  { 
    id: 'FX-SR-01', 
    name: '萤火虫', 
    rarity: 'SR', 
    image: '/images/gashapon/prizes/FX-SR-01.png', 
    quote: '挑萤火虫夜读' 
  },
  // R 级别
  { 
    id: 'FX-R-01', 
    name: '樱花魔法', 
    rarity: 'R', 
    image: '/images/gashapon/prizes/FX-R-01.png', 
    quote: '故乡的花落了' 
  },
  { 
    id: 'FX-R-02', 
    name: '落叶魔法', 
    rarity: 'R', 
    image: '/images/gashapon/prizes/FX-R-02.png', 
    quote: '又到一年考试时' 
  },
  { 
    id: 'FX-R-03', 
    name: '谧雪魔法', 
    rarity: 'R', 
    image: '/images/gashapon/prizes/FX-R-03.png', 
    quote: '越背越心寒' 
  }
];

// 🍔 美味补给系列奖品
const supplyPrizes = [
  // SSR 级别
  { 
    id: 'FOOD-SSR-01', 
    name: '梦幻圈圈', 
    rarity: 'SSR', 
    image: '/images/gashapon/prizes/FOOD-SSR-01.png', 
    quote: '吃一口我能背3个' 
  },
  // SR 级别
  { 
    id: 'FOOD-SR-01', 
    name: '小熊饼干', 
    rarity: 'SR', 
    image: '/images/gashapon/prizes/FOOD-SR-01.png', 
    quote: '热量小熊炸弹' 
  },
  // R 级别
  { 
    id: 'FOOD-R-01', 
    name: '奶奶拿铁', 
    rarity: 'R', 
    image: '/images/gashapon/prizes/FOOD-R-01.png', 
    quote: '温度是无声的拥抱' 
  },
  { 
    id: 'FOOD-R-02', 
    name: '莓莓圈圈', 
    rarity: 'R', 
    image: '/images/gashapon/prizes/FOOD-R-02.png', 
    quote: '味觉防波堤' 
  },
  // N 级别
  { 
    id: 'FOOD-N-01', 
    name: '脆脆薯条', 
    rarity: 'N', 
    image: '/images/gashapon/prizes/FOOD-N-01.png', 
    quote: 'tree tree薯条' 
  },
  { 
    id: 'FOOD-N-02', 
    name: '芝识汉堡', 
    rarity: 'N', 
    image: '/images/gashapon/prizes/FOOD-N-02.png', 
    quote: '芝士就是力量' 
  },
  { 
    id: 'FOOD-N-03', 
    name: '糖霜圈圈', 
    rarity: 'N', 
    image: '/images/gashapon/prizes/FOOD-N-03.png', 
    quote: '甜过单词' 
  }
];

// 🎯 扭蛋系列配置数据
const gashaponSeriesConfig = [
  {
    id: 1,
    name: '梦幻魔法',
    cost: 300,
    gradientType: 'blue',
    image: '/images/gashapon/prizes/FX-SSR-01.png',
    prizes: magicPrizes
  },
  {
    id: 2,
    name: '美味补给',
    cost: 100,
    gradientType: 'orange',
    image: '/images/gashapon/prizes/FOOD-SSR-01.png',
    prizes: supplyPrizes
  }
];

// 🔧 数据访问工具函数
const PrizeDataManager = {
  /**
   * 获取所有扭蛋系列数据
   * @returns {GashaponSeries[]} 所有系列数据
   */
  getAllSeries() {
    return gashaponSeriesConfig;
  },

  /**
   * 根据系列ID获取系列数据
   * @param {number} seriesId 系列ID
   * @returns {GashaponSeries|null} 系列数据或null
   */
  getSeriesById(seriesId) {
    return gashaponSeriesConfig.find(series => series.id === seriesId) || null;
  },

  /**
   * 根据奖品ID获取奖品数据
   * @param {string} prizeId 奖品ID
   * @returns {Prize|null} 奖品数据或null
   */
  getPrizeById(prizeId) {
    for (const series of gashaponSeriesConfig) {
      const prize = series.prizes.find(p => p.id === prizeId);
      if (prize) return prize;
    }
    return null;
  },

  /**
   * 获取指定系列的所有奖品
   * @param {number} seriesId 系列ID
   * @returns {Prize[]} 奖品列表
   */
  getPrizesBySeriesId(seriesId) {
    const series = this.getSeriesById(seriesId);
    return series ? series.prizes : [];
  },

  /**
   * 根据稀有度筛选奖品
   * @param {string} rarity 稀有度 (SSR/SR/R/N)
   * @param {number} seriesId 可选的系列ID，不传则搜索所有系列
   * @returns {Prize[]} 符合条件的奖品列表
   */
  getPrizesByRarity(rarity, seriesId = null) {
    const targetSeries = seriesId ? [this.getSeriesById(seriesId)] : gashaponSeriesConfig;
    const result = [];
    
    targetSeries.forEach(series => {
      if (series) {
        result.push(...series.prizes.filter(prize => prize.rarity === rarity));
      }
    });
    
    return result;
  },

  /**
   * 验证奖品数据完整性
   * @param {Prize} prize 奖品数据
   * @returns {boolean} 是否有效
   */
  validatePrize(prize) {
    return !!(prize && prize.id && prize.name && prize.rarity && prize.image && prize.quote);
  },

  /**
   * 获取所有奖品ID列表
   * @returns {string[]} 所有奖品ID
   */
  getAllPrizeIds() {
    const ids = [];
    gashaponSeriesConfig.forEach(series => {
      series.prizes.forEach(prize => {
        ids.push(prize.id);
      });
    });
    return ids;
  }
};

// 导出数据和工具
module.exports = {
  // 原始数据（保持向后兼容）
  gashaponData: gashaponSeriesConfig,
  
  // 分类数据
  magicPrizes,
  supplyPrizes,
  
  // 数据管理工具
  PrizeDataManager
};