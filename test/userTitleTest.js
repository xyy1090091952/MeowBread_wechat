// 测试用户等级称号管理器
const userTitleManager = require('../utils/userTitleManager.js');

// 测试不同已背单词数量的等级称号
console.log('=== 用户等级称号系统测试 ===');

const testCounts = [0, 25, 75, 150, 300, 600, 1200, 2000, 2800, 3800, 5000, 7000];

testCounts.forEach(count => {
  const titleInfo = userTitleManager.getUserTitleInfo(count);
  console.log(`已背${count}个单词: ${titleInfo.fullTitle} - ${titleInfo.description}`);
});

// 测试获取当前用户等级称号
console.log('\n=== 当前用户等级称号 ===');
const currentTitleInfo = userTitleManager.getCurrentUserTitleInfo();
console.log('当前用户:', currentTitleInfo);

module.exports = {};