// data/gashapon-prizes-config.js
// 扭蛋奖品数据配置文件 - 统一管理所有奖品信息
// 主人专用的奖品数据库 ✨

/**
 * 奖品数据结构定义
 * @typedef {Object} Prize
 * @property {string} id - 奖品唯一标识符
 * @property {string} name - 奖品名称
 * @property {string} rarity - 稀有度 (SSR/SR/R/N/DEFAULT)
 * @property {string} image - 奖品预览图片路径（用于库存页面展示）
 * @property {string} bannerImage - 奖品横幅图片路径（用于答题页面banner展示）
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
  // 默认奖品 - 麻瓜（无粒子效果）
  { 
    id: 'FX-DEFAULT-01', 
    name: '麻瓜', 
    rarity: 'DEFAULT', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf854b2086.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '阿瓦达啃大瓜' 
  },
  // SSR 级别
  { 
    id: 'FX-SSR-01', 
    name: '玫瑰魔法', 
    rarity: 'SSR', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf854b2086.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '阿姨洗铁路' 
  },
  // SR 级别
  { 
    id: 'FX-SR-01', 
    name: '萤火虫', 
    rarity: 'SR', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf85445556.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '挑萤火虫夜读' 
  },
  // R 级别
  { 
    id: 'FX-R-01', 
    name: '樱花魔法', 
    rarity: 'R', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf854d8832.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '故乡的樱花落了' 
  },
  { 
    id: 'FX-R-02', 
    name: '落叶魔法', 
    rarity: 'R', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf8549c6f3.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '又到一年考试时' 
  },
  { 
    id: 'FX-R-03', 
    name: '谧雪魔法', 
    rarity: 'R', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf854dc136.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: 'let it go' 
  }
];

// 🍔 美味补给系列奖品
const supplyPrizes = [
  // 默认奖品 - 普通面包（无特殊效果）
  { 
    id: 'FOOD-DEFAULT-01', 
    name: '北海道面包', 
    rarity: 'DEFAULT', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf854b2086.png', 
    bannerImage: 'https://free.picui.cn/free/2025/07/20/687bd6a37f4b4.png', // 默认大面包图片 ✨
    quote: '小叮当同款平替'
  },
  // SSR 级别
  { 
    id: 'FOOD-SSR-01', 
    name: '梦幻圈圈', 
    rarity: 'SSR', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf85670845.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '我能背一天单词' 
  },
  // SR 级别
  { 
    id: 'FOOD-SR-01', 
    name: '小熊饼干', 
    rarity: 'SR', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf856f3a00.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '小熊热量炸弹' 
  },
  // R 级别
  { 
    id: 'FOOD-R-01', 
    name: '奶奶拿铁', 
    rarity: 'R', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf85828beb.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '不是爷爷的拿铁' 
  },
  { 
    id: 'FOOD-R-02', 
    name: '莓莓圈圈', 
    rarity: 'R', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf857e63ae.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '味觉防波堤' 
  },
  // N 级别
  { 
    id: 'FOOD-N-01', 
    name: '脆脆薯条', 
    rarity: 'N', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf859a87a4.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '麦当劳薯条，条条条' 
  },
  { 
    id: 'FOOD-N-02', 
    name: '芝识汉堡', 
    rarity: 'N', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf8593a21e.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '芝士就是力量' 
  },
  { 
    id: 'FOOD-N-03', 
    name: '糖霜圈圈', 
    rarity: 'N', 
    image: 'https://free.picui.cn/free/2025/07/20/687cf85854f37.png', 
    bannerImage: '', // 答题页面横幅图片（待添加）
    quote: '安赛蜜圈圈' 
  }
];

// 🎯 扭蛋系列配置数据
const gashaponSeriesConfig = [
  {
    id: 1,
    name: '梦幻魔法',
    cost: 300,
    gradientType: 'blue',
    prizes: magicPrizes
  },
  {
    id: 2,
    name: '美味补给',
    cost: 100,
    gradientType: 'orange',
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