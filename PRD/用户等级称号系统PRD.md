# 用户等级称号系统 PRD

## 📋 文档信息
- **创建日期**: 2025年7月3
- **版本**: v2.0
- **负责人**: MeowBread Team
- **文档类型**: 产品需求文档

## 🎯 需求背景

### 产品目标
通过等级称号系统激励用户持续学习，增强用户粘性和成就感，提升产品活跃度。

### 设计理念
- **日式风格**: 符合Meow Bread的整体主题
- **进阶感强**: 11个等级，层次分明
- **视觉友好**: 每个称号配备专属emoji
- **激励性强**: 合理的升级门槛，持续的成就感

## 🏆 等级体系设计

### 完整等级表

| 等级 | 答题门槛 | 称号 | Emoji | 含义解释 |
|------|----------|------|-------|----------|
| **0** | 0-49题 | 新人さん | 🌱 | 刚加入的新人，用敬语表示欢迎 |
| **1** | 50+题 | 初心者 | 🌸 | 初学者，樱花代表新的开始 |
| **2** | 100+题 | 背単語生 | 📚 | 背单词学生，认真学习阶段 |
| **3** | 200+题 | 学習者 | 📖 | 学习者，已有基础知识 |
| **4** | 500+题 | 単語忍者 | 🥷 | 单词忍者，技能熟练 |
| **5** | 1000+题 | 記憶武士 | ⚔️ | 记忆武士，战斗力强 |
| **6** | 2000+题 | 言語達人 | 🎯 | 语言达人，精准掌握 |
| **7** | 5000+题 | 単語仙人 | 🧙‍♂️ | 单词仙人，修炼高深 |
| **8** | 10000+题 | 語彙王 | 👑 | 词汇之王，王者地位 |
| **9** | 20000+题 | 辞書マスター | 📜 | 辞典大师，活字典级别 |
| **10** | 50000+题 | 言葉の神 | ⚡ | 单词之神，传说级存在 |

## 🔧 技术实现

### 核心文件位置
- **主逻辑**: `pages/profile/profile.js`
- **显示组件**: `pages/profile/profile.wxml`
- **样式文件**: `pages/profile/profile.wxss`

### 实现代码

#### 等级判断逻辑 (`pages/profile/profile.js`)
```javascript
// 根据答题数量更新用户称号
updateUserTitle: function(totalQuestions) {
  let title = '新人さん 🌱'; // 默认称号（0-49题）
  
  // 11个等级，从高到低判断
  if (totalQuestions >= 50000) {
    title = '言葉の神 ⚡';           // 等级10
  } else if (totalQuestions >= 20000) {
    title = '辞書マスター 📜';       // 等级9
  } else if (totalQuestions >= 10000) {
    title = '語彙王 👑';             // 等级8
  } else if (totalQuestions >= 5000) {
    title = '単語仙人 🧙‍♂️';        // 等级7
  } else if (totalQuestions >= 2000) {
    title = '言語達人 🎯';           // 等级6
  } else if (totalQuestions >= 1000) {
    title = '記憶武士 ⚔️';           // 等级5
  } else if (totalQuestions >= 500) {
    title = '単語忍者 🥷';           // 等级4
  } else if (totalQuestions >= 200) {
    title = '学習者 📖';             // 等级3
  } else if (totalQuestions >= 100) {
    title = '背単語生 📚';           // 等级2
  } else if (totalQuestions >= 50) {
    title = '初心者 🌸';             // 等级1
  }
  
  console.log(`用户答题数: ${totalQuestions}, 获得称号: ${title}`);
  
  this.setData({
    userTitle: title
  });
}
```

#### 数据绑定 (`pages/profile/profile.wxml`)
```xml
<!-- 显示用户称号 -->
<view class="user-title">{{userTitle}}</view>
```

#### 调用时机
1. **页面加载**: `loadStatistics()` → `updateUserTitle()`
2. **数据更新**: 每次进入profile页面自动刷新
3. **答题后**: 通过统计系统自动触发更新

## 📊 数据来源

### 答题数据获取
```javascript
// 从统计管理器获取真实答题数据
const realStatistics = statisticsManager.getOverallStatistics();
// realStatistics.totalQuestions 即为累计答题数
```

### 数据流程
1. 用户答题 → 保存到 `userQuizStatistics`
2. Profile页面 → 读取统计数据
3. 计算总题数 → 判断等级
4. 更新称号显示



## 🔍 关键字段位置速查

### 称号显示位置
- **文件**: `pages/profile/profile.wxml`
- **元素**: `<view class="user-title">{{userTitle}}</view>`
- **数据源**: `this.data.userTitle`

### 等级判断位置
- **文件**: `pages/profile/profile.js`
- **方法**: `updateUserTitle(totalQuestions)`
- **调用**: `loadStatistics()` 函数中

### 数据来源位置
- **统计数据**: `statisticsManager.getOverallStatistics()`
- **关键字段**: `realStatistics.totalQuestions`

## 📝 维护说明

### 修改等级门槛
如需调整等级门槛，修改 `updateUserTitle` 函数中的数值判断即可。

### 新增等级
1. 在 `updateUserTitle` 函数中添加新的判断条件
2. 设计新的称号名称和emoji
3. 更新本PRD文档的等级表

### 称号文案修改
直接修改 `title = '称号名称 emoji'` 即可，建议保持日式风格一致性。

## 🚀 未来扩展

### 可扩展功能
- **等级徽章**: 为每个等级设计专属徽章图标
- **升级动画**: 等级提升时的动画效果
- **等级特权**: 不同等级解锁不同功能
- **排行榜**: 基于等级的用户排行
- **称号收集**: 历史称号收集系统
- **自定义称号**: 高级用户可自定义称号

### 数据分析扩展
- **等级分布**: 用户等级分布统计
- **升级路径**: 用户升级时间分析
- **流失分析**: 不同等级的用户留存率

---