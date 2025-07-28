# 知识库通用模板使用说明

## 📋 概述

这是一个真正的通用知识库模板，通过单一页面 + 数据配置的方式实现所有知识库内容的展示。

## 🗂️ 文件结构

```
pages/knowledge-base/
├── knowledge-base.js      # 通用页面逻辑（唯一的JS文件）
├── knowledge-base.wxml    # 通用页面模板（唯一的WXML文件）
├── knowledge-base.wxss    # 通用页面样式（唯一的WXSS文件）
├── knowledge-base.json    # 通用页面配置（唯一的JSON文件）
└── knowledge-data.js      # 所有知识库数据（唯一的数据文件）
```

## 🎯 核心优势

### 1. 真正的通用性
- **只有1套文件**：4个页面文件 + 1个数据文件 = 总共5个文件
- **无重复代码**：所有知识库共享同一套模板
- **数据驱动**：通过URL参数动态加载不同内容

### 2. 数据命名规范
- **格式**：`level_card_order`（如：`N5_1`、`N4_2`）
- **关联性**：与 `knowledge_cards.js` 中的 `level` 和 `card_order` 字段对应
- **易识别**：命名直观，便于管理和维护

### 3. 灵活的访问方式
支持多种URL参数格式：
```javascript
// 方式1：直接传入ID
/pages/knowledge-base/knowledge-base?id=N5_1

// 方式2：分别传入level和card_order
/pages/knowledge-base/knowledge-base?level=N5&card_order=1

// 方式3：使用其他参数名
/pages/knowledge-base/knowledge-base?pageId=N5_1
/pages/knowledge-base/knowledge-base?knowledgeId=N5_1
```

## 📊 数据结构

### knowledge-data.js 数据格式
```javascript
const knowledgeData = {
  'N5_1': {
    title: "动词的过去式和过去分词",
    description: "掌握日语动词的时态变化规律",
    sections: [
      {
        id: 1,
        title: "1. 规则动词（一段动词）",
        type: "table",
        tableData: {
          headers: ["动词原形", "过去式", "过去分词", "中文意思"],
          rows: [
            ["食べる", "食べた", "食べられる", "吃"],
            // ... 更多数据
          ]
        }
      }
      // ... 更多章节
    ]
  }
  // ... 更多知识库
};
```

## 🚀 使用方法

### 1. 访问现有知识库
```javascript
// 在其他页面跳转到知识库
wx.navigateTo({
  url: '/pages/knowledge-base/knowledge-base?id=N5_1'
});
```

### 2. 添加新知识库
只需在 `knowledge-data.js` 中添加新的数据项：

```javascript
// 添加N5级别第4个知识库
'N5_4': {
  title: "新的知识库标题",
  description: "知识库描述",
  sections: [
    // ... 章节数据
  ]
}
```

### 3. 与 knowledge_cards.js 关联
确保数据命名与卡片数据对应：

```javascript
// knowledge_cards.js 中的数据
{
  level: "N5",
  card_order: 1,
  page_url: "/pages/knowledge-base/knowledge-base?id=N5_1"
}

// knowledge-data.js 中对应的数据
'N5_1': {
  title: "对应的知识库内容",
  // ...
}
```

## 🎨 功能特性

### 1. 自动功能
- ✅ 根据URL参数自动加载对应数据
- ✅ 自动设置页面标题
- ✅ 支持下拉刷新
- ✅ 错误处理和重试机制
- ✅ 加载状态显示

### 2. 分享功能
- ✅ 分享到微信好友
- ✅ 分享到朋友圈
- ✅ 自动生成分享链接

### 3. 响应式设计
- ✅ 适配不同屏幕尺寸
- ✅ 表格横向滚动
- ✅ 美观的渐变色设计

## 📈 效果对比

| 方案 | 文件数量 | 复用率 | 维护难度 | 扩展性 |
|------|----------|--------|----------|--------|
| 传统方案 | N×4个 | 0% | 高 | 差 |
| **通用模板** | **5个** | **100%** | **低** | **优** |

## 🔧 技术实现

### 1. 动态数据加载
```javascript
// 支持多种参数格式的解析
let pageId = options.id || options.pageId || options.knowledgeId;
if (!pageId && options.level && options.card_order) {
  pageId = `${options.level}_${options.card_order}`;
}
```

### 2. 错误处理
```javascript
// 完善的错误处理机制
if (data) {
  // 成功加载
} else {
  this.setData({
    error: `未找到对应的知识库内容 (ID: ${id})`,
    loading: false
  });
}
```

### 3. 模板渲染
```xml
<!-- 条件渲染不同类型的内容 -->
<view wx:if="{{section.type === 'table'}}" class="table-container">
  <!-- 表格内容 -->
</view>
<view wx:elif="{{section.type === 'section'}}" class="subsections-container">
  <!-- 章节内容 -->
</view>
```

## 📝 总结

这个通用模板真正实现了：
- **一套代码，服务所有知识库** 🎯
- **数据与界面完全分离** 📊  
- **命名规范与现有系统关联** 🔗
- **零重复，高复用** ♻️
- **易维护，易扩展** 🚀

现在添加新知识库只需要在 `knowledge-data.js` 中添加一条数据即可，无需创建任何新文件！ ✨