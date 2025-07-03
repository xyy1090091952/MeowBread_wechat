# 答题统计数据系统 PRD

## 📋 文档信息
- **创建日期**: 2024年12月
- **版本**: v1.0
- **负责人**: MeowBread Team
- **文档类型**: 产品需求文档

## 🎯 需求背景

### 问题描述
Profile页面的`accuracy-value`显示固定值80%，无法反映用户真实的答题表现，影响用户体验和成就感。

### 解决方案
实现完整的答题统计数据系统，自动记录和计算用户的真实答题准确率。

## 🏗️ 系统架构

### 核心组件
1. **统计管理器** (`utils/statisticsManager.js`)
2. **Profile页面数据展示** (`pages/profile/profile.js`)
3. **答题结果数据保存** (`pages/quiz-result/quiz-result.js`)

## 📊 数据结构设计

### 本地存储数据结构
```javascript
// 存储键名: 'userQuizStatistics'
[
  {
    score: 8,              // 本次得分
    totalQuestions: 10,    // 本次总题数
    timeSpent: 120,        // 本次用时(秒)
    accuracy: 0.8,         // 本次准确率(0-1)
    timestamp: 1703123456789, // 时间戳
    date: "2024/12/21"     // 日期字符串
  },
  // ... 更多答题记录
]
```

### 统计数据字段
```javascript
{
  totalQuestions: 150,      // 累计总题数
  correctAnswers: 120,      // 累计正确数
  averageAccuracy: 80,      // 平均准确率(%)
  totalQuizzes: 15,         // 总答题次数
  totalTimeSpent: 1800,     // 累计用时(秒)
  averageTimePerQuestion: 12 // 平均每题用时(秒)
}
```

## 🔧 实现方案

### 1. 统计管理器 (`utils/statisticsManager.js`)

#### 核心方法
- `saveQuizResult(quizResult)` - 保存单次答题结果
- `getOverallStatistics()` - 获取总体统计数据
- `getTodayStatistics()` - 获取今日统计数据
- `getRecentQuizzes(limit)` - 获取最近答题记录
- `clearAllStatistics()` - 清除所有统计数据

#### 关键算法
```javascript
// 计算平均准确率
const averageAccuracy = totalQuestions > 0 
  ? Math.round((totalCorrectAnswers / totalQuestions) * 100) 
  : 0;
```

### 2. Profile页面集成 (`pages/profile/profile.js`)

#### 修改位置
```javascript
// 第2行：引入统计管理器
const statisticsManager = require('../../utils/statisticsManager.js');

// loadStatistics函数：使用真实数据
loadStatistics: function () {
  const realStatistics = statisticsManager.getOverallStatistics();
  this.setData({
    statistics: realStatistics,
    mistakeCount: mistakeCount
  });
}
```

#### 数据绑定
```xml
<!-- pages/profile/profile.wxml 第46行 -->
<text class="accuracy-value">{{statistics.averageAccuracy}}%</text>
```

### 3. 答题结果保存 (`pages/quiz-result/quiz-result.js`)

#### 修改位置
```javascript
// 第2行：引入统计管理器
const statisticsManager = require('../../utils/statisticsManager.js');

// onLoad函数：自动保存统计数据
onLoad: function (options) {
  // ... 设置页面数据
  this.saveQuizStatistics(); // 保存统计数据
  this.triggerAnimations();
}

// 新增方法：保存统计数据
saveQuizStatistics: function() {
  const quizResult = {
    score: this.data.score,
    totalQuestions: this.data.totalQuestions,
    timeSpent: this.data.timeSpent,
    accuracy: this.data.accuracy
  };
  statisticsManager.saveQuizResult(quizResult);
}
```

## 🔄 数据流程

### 答题流程
1. 用户在quiz页面答题
2. 答题结束跳转到quiz-result页面
3. quiz-result页面自动调用`saveQuizStatistics()`保存数据
4. 数据存储到本地Storage的`userQuizStatistics`键

### 显示流程
1. 用户进入profile页面
2. 调用`loadStatistics()`函数
3. 通过`statisticsManager.getOverallStatistics()`获取累计数据
4. 计算并显示平均准确率

## 📱 用户体验

### 功能特点
- ✅ **实时更新**: 每次答题后自动更新统计数据
- ✅ **累积计算**: 基于历史所有答题记录计算准确率
- ✅ **数据持久**: 本地存储，不会丢失
- ✅ **零配置**: 用户无需任何设置，自动工作

### 显示效果
- **初次使用**: 显示0%（无答题记录）
- **答题后**: 显示真实的累计准确率
- **多次答题**: 准确率动态变化，反映真实水平

## 🧪 测试场景

### 测试用例
1. **新用户测试**: 确认初始显示0%
2. **单次答题测试**: 确认数据正确保存和显示
3. **多次答题测试**: 确认累计计算正确
4. **数据持久测试**: 重启应用后数据保持
5. **边界测试**: 全对/全错的极端情况

## 🔍 关键字段位置速查

### 准确率显示位置
- **文件**: `pages/profile/profile.wxml`
- **行号**: 第46行
- **代码**: `<text class="accuracy-value">{{statistics.averageAccuracy}}%</text>`

### 数据计算位置
- **文件**: `utils/statisticsManager.js`
- **方法**: `getOverallStatistics()`
- **算法**: `Math.round((totalCorrectAnswers / totalQuestions) * 100)`

### 数据保存位置
- **文件**: `pages/quiz-result/quiz-result.js`
- **方法**: `saveQuizStatistics()`
- **存储键**: `userQuizStatistics`

## 📝 注意事项

1. **数据兼容性**: 旧版本用户首次使用时会显示0%，这是正常的
2. **性能考虑**: 统计数据在本地计算，不影响应用性能
3. **数据清理**: 登出时不清除统计数据，保留用户成就
4. **错误处理**: 所有统计方法都有try-catch保护

## 🚀 未来扩展

### 可扩展功能
- 按日期查看答题趋势
- 不同题型的分类统计
- 答题速度分析
- 学习曲线可视化

---

**文档状态**: ✅ 已实现并测试完成 