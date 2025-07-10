// pages/gashapon/gashapon-prizes.js
// 定义所有扭蛋系列的数据，包括系列信息和奖品列表

const gashaponData = [
  {
    id: 1,
    name: '特效扭蛋',
    cost: 100,
    // 卡片背景渐变色
    gradientType: 'blue',
    // 卡片装饰图片
    image: '/images/gashapon/prizes/FX-SSR-01.png',
    prizes: [
      { id: 'FX-SSR-01', name: '樱花', rarity: 'SSR', image: '/images/gashapon/prizes/FX-SSR-01.png' },
      { id: 'FX-SR-01', name: '流星雨', rarity: 'SR', image: '/images/gashapon/prizes/FX-SR-01.png' },
      { id: 'FX-SR-02', name: '彩虹桥', rarity: 'SR', image: '/images/gashapon/prizes/FX-SR-02.png' },
      { id: 'FX-R-01', name: '闪亮星星', rarity: 'R', image: '/images/gashapon/prizes/FX-R-01.png' },
      { id: 'FX-R-02', name: '爱心泡泡', rarity: 'R', image: '/images/gashapon/prizes/FX-R-02.png' },
      { id: 'FX-R-03', name: '音符飘散', rarity: 'R', image: '/images/gashapon/prizes/FX-R-03.png' },
    ]
  },
  {
    id: 2,
    name: '人类口粮',
    cost: 120,
    // 卡片背景渐变色
    gradientType: 'orange',
    // 卡片装饰图片
    image: '/images/gashapon/prizes/FOOD-SSR-01.png',
    prizes: [
      { id: 'FOOD-SSR-01', name: '海鲜大餐', rarity: 'SSR', image: '/images/gashapon/prizes/FOOD-SSR-01.png' },
      { id: 'FOOD-SR-01', name: '豪华牛排', rarity: 'SR', image: '/images/gashapon/prizes/FOOD-SR-01.png' },
      { id: 'FOOD-SR-02', name: '三层大汉堡', rarity: 'SR', image: '/images/gashapon/prizes/FOOD-SR-02.png' },
      { id: 'FOOD-R-01', name: '披萨', rarity: 'R', image: '/images/gashapon/prizes/FOOD-R-01.png' },
      { id: 'FOOD-R-02', name: '甜甜圈', rarity: 'R', image: '/images/gashapon/prizes/FOOD-R-02.png' },
      { id: 'FOOD-R-03', name: '薯条', rarity: 'R', image: '/images/gashapon/prizes/FOOD-R-03.png' },
    ]
  },
  {
    id: 3,
    name: '猫咪口粮',
    cost: 150,
    // 卡片背景渐变色
    gradientType: 'green',
    // 卡片装饰图片
    image: '/images/gashapon/prizes/CAT-SSR-01.png',
    prizes: [
      { id: 'CAT-SSR-01', name: '巅峰猫罐头', rarity: 'SSR', image: '/images/gashapon/prizes/CAT-SSR-01.png' },
      { id: 'CAT-SR-01', name: '冻干鸡肉', rarity: 'SR', image: '/images/gashapon/prizes/CAT-SR-01.png' },
      { id: 'CAT-SR-02', name: '猫薄荷棒', rarity: 'SR', image: '/images/gashapon/prizes/CAT-SR-02.png' },
      { id: 'CAT-R-01', name: '小鱼干', rarity: 'R', image: '/images/gashapon/prizes/CAT-R-01.png' },
      { id: 'CAT-R-02', name: '猫条', rarity: 'R', image: '/images/gashapon/prizes/CAT-R-02.png' },
      { id: 'CAT-R-03', name: '猫抓板', rarity: 'R', image: '/images/gashapon/prizes/CAT-R-03.png' },
    ]
  }
];

// 导出扭蛋机数据
module.exports = {
  gashaponData: gashaponData
};