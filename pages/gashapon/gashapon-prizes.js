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
      { id: 'FX-SSR-01', name: '樱花', rarity: 'SSR', image: '/images/gashapon/prizes/FX-SSR-01.png', quote: '春日限定的浪漫，随风飘落的花瓣。' },
      { id: 'FX-SR-01', name: '流星雨', rarity: 'SR', image: '/images/gashapon/prizes/FX-SR-01.png', quote: '划过天际的奇迹，快许个愿吧！' },
      { id: 'FX-SR-02', name: '彩虹桥', rarity: 'SR', image: '/images/gashapon/prizes/FX-SR-02.png', quote: '连接着梦想与现实的七彩桥梁。' },
      { id: 'FX-R-01', name: '闪亮星星', rarity: 'R', image: '/images/gashapon/prizes/FX-R-01.png', quote: '夜空中最亮的星，指引你前行。' },
      { id: 'FX-R-02', name: '爱心泡泡', rarity: 'R', image: '/images/gashapon/prizes/FX-R-02.png', quote: '充满爱意的泡泡，砰然心动的感觉。' },
      { id: 'FX-R-03', name: '音符飘散', rarity: 'R', image: '/images/gashapon/prizes/FX-R-03.png', quote: '空气中弥漫着旋律，这是来自异次元的音乐。' },
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
      { id: 'FOOD-SSR-01', name: '海鲜大餐', rarity: 'SSR', image: '/images/gashapon/prizes/FOOD-SSR-01.png', quote: '来自深海的馈赠，满足你对大海的所有想象。' },
      { id: 'FOOD-SR-01', name: '豪华牛排', rarity: 'SR', image: '/images/gashapon/prizes/FOOD-SR-01.png', quote: '滋滋作响的美味，是力量和能量的源泉。' },
      { id: 'FOOD-SR-02', name: '三层大汉堡', rarity: 'SR', image: '/images/gashapon/prizes/FOOD-SR-02.png', quote: '一口咬下，是三倍的快乐和满足！' },
      { id: 'FOOD-R-01', name: '披萨', rarity: 'R', image: '/images/gashapon/prizes/FOOD-R-01.png', quote: '可以和朋友分享的快乐，每一角都有不同滋味。' },
      { id: 'FOOD-R-02', name: '甜甜圈', rarity: 'R', image: '/images/gashapon/prizes/FOOD-R-02.png', quote: '生活需要一点甜，就像这个彩色的圆圈。' },
      { id: 'FOOD-R-03', name: '薯条', rarity: 'R', image: '/images/gashapon/prizes/FOOD-R-03.png', quote: '金黄酥脆，是追剧和聊天的最佳伴侣。' },
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
      { id: 'CAT-SSR-01', name: '巅峰猫罐头', rarity: 'SSR', image: '/images/gashapon/prizes/CAT-SSR-01.png', quote: '猫咪的米其林大餐，一口沦陷！' },
      { id: 'CAT-SR-01', name: '冻干鸡肉', rarity: 'SR', image: '/images/gashapon/prizes/CAT-SR-01.png', quote: '锁住原汁原味的鲜美，嘎嘣脆！' },
      { id: 'CAT-SR-02', name: '猫薄荷棒', rarity: 'SR', image: '/images/gashapon/prizes/CAT-SR-02.png', quote: '让猫咪欲罢不能的快乐魔法棒。' },
      { id: 'CAT-R-01', name: '小鱼干', rarity: 'R', image: '/images/gashapon/prizes/CAT-R-01.png', quote: '来自海洋的咸香，是猫咪最爱的零食。' },
      { id: 'CAT-R-02', name: '猫条', rarity: 'R', image: '/images/gashapon/prizes/CAT-R-02.png', quote: '“喵~”这是世界上最动听的语言。' },
      { id: 'CAT-R-03', name: '猫抓板', rarity: 'R', image: '/images/gashapon/prizes/CAT-R-03.png', quote: '磨爪是本能，破坏是天性，快乐是宗旨！' },
    ]
  }
];

// 导出扭蛋机数据
module.exports = {
  gashaponData: gashaponData
};