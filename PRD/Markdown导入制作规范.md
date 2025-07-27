# Markdown 导入制作规范（统一版本）

## 📋 文档说明

这是微信小程序日语学习应用中 **Markdown 内容导入和页面制作的统一规范文档**。
所有 Markdown 导入工作请参照此文档执行。

---

## 🎯 **知识库页面复用优化方案** ⭐⭐⭐⭐⭐

### 📋 **方案对比**

| 方案 | 复用率 | 文件结构 | 路径保持 | 维护难度 | 推荐度 |
|------|--------|----------|----------|----------|--------|
| **方案一：通用模板页面** | 75% | 4个模板+N×4个引用+N个数据 | ✅ 完全保持 | ⭐⭐⭐⭐ | 🔥 推荐 |
| **方案二：数据配置化** | 90% | 5个通用文件 | ❌ 需要修改 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🏆 **方案一：通用模板页面**（当前采用）

### 📊 **复用率提升**
- **传统方案**: 每个知识库需要 4 个完整文件（.js, .wxml, .wxss, .json）
- **方案一**: 4 个通用模板 + 每个页面 4 个引用文件 + 数据文件
- **复用率**: **75%** （模板文件完全复用，引用文件极简）

### 🗂️ **文件结构**
```
📁 pages/knowledge-base/
├── 📄 template.js       // 通用页面逻辑模板
├── 📄 template.wxml     // 通用页面结构模板  
├── 📄 template.wxss     // 通用页面样式模板
├── 📄 template.json     // 通用页面配置模板
├── 📁 data/             // 数据文件目录
│   ├── 📄 1-1.js       // 1-1页面纯数据
│   ├── 📄 1-2.js       // 1-2页面纯数据
│   └── 📄 1-3.js       // 1-3页面纯数据
├── 📁 1-1/             // 1-1页面目录
│   ├── 📄 1-1.js       // 引用模板+数据（3行代码）
│   ├── 📄 1-1.wxml     // 引用模板（2行代码）
│   ├── 📄 1-1.wxss     // 引用样式（1行代码）
│   └── 📄 1-1.json     // 页面配置（仅标题不同）
├── 📁 1-2/             // 1-2页面目录
│   └── ... (同上结构)
└── 📁 1-3/             // 1-3页面目录
    └── ... (同上结构)
```

### 🚀 **使用方式**
```javascript
// 1. 访问页面（保持原有路径）
/pages/knowledge-base/1-1/1-1  // 动词过去式
/pages/knowledge-base/1-2/1-2  // 自动词他动词
/pages/knowledge-base/1-3/1-3  // 敬语用法

// 2. 在代码中跳转（无需修改）
wx.navigateTo({
  url: '/pages/knowledge-base/1-1/1-1'
});

// 3. 添加新知识库（创建数据文件+4个引用文件）
// 步骤1: 创建 data/1-4.js
// 步骤2: 创建 1-4/ 目录和4个引用文件
// 步骤3: 在 app.json 中注册页面
```

### ✨ **方案一优势**
- 🎯 **高度复用**: 75%的代码复用率
- 🔄 **路径兼容**: 完全保持现有页面路径
- 📝 **数据分离**: 页面逻辑与数据完全分离
- 🚀 **快速扩展**: 引用文件内容极简
- 💡 **统一维护**: 样式和逻辑统一管理

---

## 🥈 **方案二：数据配置化**（备选方案）

### 📊 **复用率提升**
- **传统方案**: 每个知识库需要 4 个文件（.js, .wxml, .wxss, .json）
- **方案二**: 所有知识库共享 4 个通用文件 + 1 个数据配置文件
- **复用率**: **90%** （从 N×4 个文件减少到 5 个文件）

### 🗂️ **文件结构**
```
📁 pages/knowledge-base/
├── 📄 index.js          // 通用页面逻辑
├── 📄 index.wxml        // 通用页面模板
├── 📄 index.wxss        // 通用页面样式
├── 📄 index.json        // 通用页面配置
├── 📄 knowledge-data.js // 统一数据配置
└── 📄 route-example.js  // 路由使用示例
```

### 🚀 **使用方式**
```javascript
// 1. 访问不同知识库（通过路由参数）
/pages/knowledge-base/index?id=1-1  // 动词过去式
/pages/knowledge-base/index?id=1-2  // 自动词他动词
/pages/knowledge-base/index?id=1-3  // 敬语用法

// 2. 在代码中跳转
wx.navigateTo({
  url: `/pages/knowledge-base/index?id=1-2`
});

// 3. 添加新知识库（只需修改 knowledge-data.js）
knowledgeData['1-4'] = {
  title: "新知识库标题",
  sections: [...]
};
```

### ✨ **方案二优势**
- 🎯 **极高复用**: 90%的代码复用率
- 🔄 **统一管理**: 一处修改，全局生效
- 📝 **简化维护**: 只需更新数据配置
- 🚀 **快速扩展**: 添加新内容只需修改数据文件

### ⚠️ **方案二限制**
- 🔄 **路径变更**: 需要修改现有的页面跳转逻辑
- 📱 **app.json**: 需要更新页面注册配置

---

## 🚀 快速导入流程

### 1️⃣ 接收 Markdown 文档
用户提供标准 markdown 格式的文档

### 2️⃣ 转换数据结构
按照本文档规范转换为 JavaScript 数据结构

### 3️⃣ 更新数据配置
在 `knowledge-data.js` 中添加新的知识库数据

### 4️⃣ 验证样式效果
通过路由参数访问新页面，确保符合设计规范

---

## 🎨 最新设计规范（2025年7月更新）

### 📱 容器布局
```css
.page {
  min-height: 100vh;
  background: #ffffff; /* 纯白背景 */
}
```

### 📝 文字规范

#### 页面标题 (page-title)
- **字号**: 48rpx
- **颜色**: #000000 (黑色)
- **样式**: 加粗
- **边距**: 上48rpx，下40rpx，左48rpx

```css
.page-title {
  font-size: 48rpx !important;
  font-weight: bold !important;
  color: #000000 !important;
  margin-top: 48rpx !important;
  margin-bottom: 40rpx !important;
  padding-left: 48rpx !important;
}
```

#### 章节标题 (section-title)
- **字号**: 40rpx
- **颜色**: #000000 (黑色)
- **样式**: 加粗
- **边距**: 下32rpx，左48rpx
- **⚠️ 注意**: 不设置 margin-top（避免被其他样式覆盖）

```css
.section-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #000000;
  margin-bottom: 32rpx;
  padding-left: 48rpx;
}
```

#### 子章节标题 (subsection-title)
- **字号**: 32rpx
- **颜色**: #000000 (黑色)
- **样式**: 加粗
- **边距**: 下24rpx，左48rpx
- **⚠️ 注意**: 不设置 margin-top（避免被其他样式覆盖）

```css
.subsection-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #000000;
  margin-bottom: 24rpx;
  padding-left: 48rpx;
}
```

### 📋 WXML 结构规范

#### 三层嵌套结构（重要！）
为了确保滚动和边距的正确显示，表格必须使用以下三层结构：

```xml
<!-- 第一层：滚动容器 -->
<view class="table-wrapper">
  <!-- 第二层：内容容器 -->
  <view class="table-container">
    <!-- 第三层：表格本体 -->
    <view class="table">
      <view class="table-row table-header">
        <view class="table-cell header-cell">状态</view>
        <view class="table-cell header-cell">内容</view>
      </view>
      <view class="table-row" wx:for="{{section.tableData.rows}}" wx:key="index">
        <view class="table-cell" wx:for="{{item}}" wx:key="index">{{item}}</view>
      </view>
    </view>
  </view>
</view>
```

#### 结构说明
- **table-wrapper**: 控制滚动和外边距，使用 `padding` 避免内容被裁剪
- **table-container**: 确保滚动时右侧有足够空间，自适应内容宽度
- **table**: 表格本体，CSS table 布局，圆角和投影

---

## 📊 表格规范

#### 表格容器 (table-wrapper)
- **滚动**: 水平滚动（隐藏滚动条）
- **边距**: 左右各48rpx，上8rpx，下25rpx（为投影留空间）
- **重要**: 使用 `padding` 而不是 `margin` 避免滚动时内容被裁剪

```css
.table-wrapper {
  margin-bottom: 48rpx;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  /* 使用padding来控制边距，避免滚动时内容被裁剪 */
  padding-left: 48rpx;
  padding-right: 48rpx;
  padding-top: 8rpx;
  padding-bottom: 25rpx;
  width: 100%;
  box-sizing: border-box;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

/* 隐藏滚动条 */
.table-wrapper::-webkit-scrollbar {
  height: 0;
  width: 0;
  display: none;
}
```

#### 表格容器 (table-container)
- **作用**: 确保滚动时右侧有足够空间
- **宽度**: 自适应内容，最小宽度为父容器减去左右padding
- **右侧空间**: 额外48rpx确保滚动体验

```css
.table-container {
  width: max-content; /* 让容器宽度适应内容 */
  min-width: calc(100% - 96rpx); /* 减去左右padding后的宽度 */
  padding-right: 48rpx; /* 在内容右侧添加额外空间，确保滚动到最右侧时有呼吸空间 */
  box-sizing: border-box;
}
```

#### 表格主体 (table)
- **圆角**: 24rpx（2024年12月从48rpx调整）
- **投影**: `0 8rpx 24rpx rgba(0, 0, 0, 0.05)`（2024年12月优化）
- **布局**: CSS table布局，自动计算列宽
- **最小宽度**: 800rpx（触发水平滚动）

```css
.table {
  display: table;
  width: auto;
  min-width: 800rpx; /* 设置最小宽度确保触发滚动 */
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
  table-layout: auto;
  border-collapse: separate;
  border-spacing: 0;
  /* 不需要额外的margin */
}
```

#### 表格头部 (table-header)
- **背景**: 渐变色 #A9FFCA 到 #D2FFE3
- **字号**: 28rpx
- **颜色**: #000000 (黑色)
- **样式**: 加粗

```css
.table-header {
  background: linear-gradient(90deg, #A9FFCA 0%, #D2FFE3 100%);
}

.header-cell {
  background: transparent !important;
  color: #000000 !important;
}
```

#### 表格单元格 (table-cell)
- **字号**: 28rpx
- **颜色**: #666666 (深灰色)
- **样式**: 加粗
- **对齐**: 左对齐
- **边距**: 上下16rpx，左右48rpx
- **宽度**: 自动计算（CSS table布局）

```css
.table-cell {
  display: table-cell;
  padding: 16rpx 48rpx;
  vertical-align: middle;
  text-align: left;
  border-right: 1rpx solid #ecf0f1;
  white-space: nowrap;
  min-width: 120rpx;
  max-width: 500rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #666666;
  line-height: 1.5;
}
```

#### 表格行颜色交替
- **奇数行**: #ffffff (白色)
- **偶数行**: #FAFAFA (浅灰色)

```css
.table-row:nth-child(odd) {
  background-color: #ffffff;
}

.table-row:nth-child(even) {
  background-color: #FAFAFA;
}
```

#### 表格圆角处理
```css
/* 第一行圆角 */
.table-row:first-child .table-cell:first-child {
  border-top-left-radius: 24rpx;
}

.table-row:first-child .table-cell:last-child {
  border-top-right-radius: 24rpx;
}

/* 最后一行圆角 */
.table-row:last-child .table-cell:first-child {
  border-bottom-left-radius: 24rpx;
}

.table-row:last-child .table-cell:last-child {
  border-bottom-right-radius: 24rpx;
}
```

---

## 📱 数据结构规范

### 标准数据格式
```javascript
grammarData: {
  sections: [
    {
      id: 1,
      title: '1. 名词变化表',          // 包含数字前缀
      level: 3,                      // 标题级别
      type: 'table',                 // 直接包含表格
      tableData: {
        headers: ['状态', '内容', '状态', '内容'],
        rows: [
          ['简体肯定', 'だ', '简体否定', 'ではない'],
          ['敬体肯定', 'です', '敬体否定', 'ではありません']
        ]
      }
    },
    {
      id: 2,
      title: '2. 动词变化表',
      level: 3,
      type: 'section',               // 包含子章节
      subsections: [
        {
          id: 21,
          title: '2.1. 五段动词',      // 子标题数字前缀
          level: 4,
          type: 'table',
          tableData: {
            headers: ['状态', '内容', '状态', '内容'],
            rows: [
              ['简体肯定', '書く', '简体否定', '書かない']
            ]
          }
        }
      ]
    }
  ]
}
```

### 数字前缀规则
- **一级标题**: 1. 2. 3. 等
- **二级标题**: 1.1. 1.2. 2.1. 2.2. 等
- **格式**: 数字 + 点 + 空格 + 标题文字

---

## 🔧 导入操作步骤

### 步骤1: 处理 Markdown 文档
```markdown
### 1. 名词变化表

|状态|内容|状态|内容|
|-|-|-|-|
|简体肯定|だ|简体否定|ではない|

### 2. 动词变化表

#### 2.1. 五段动词

|状态|内容|状态|内容|
|-|-|-|-|
|简体肯定|書く|简体否定|書かない|
```

### 步骤2: 转换为数据结构
```javascript
// 在 pages/grammar/grammar.js 中更新
this.setData({
  title: '新的页面标题',
  grammarData: {
    sections: [/* 转换后的数据结构 */]
  }
});
```

### 步骤3: 验证页面效果
- [ ] 页面标题字号48rpx
- [ ] 章节标题字号40rpx，左边距48rpx
- [ ] 子标题字号32rpx，左边距48rpx
- [ ] 表格圆角24rpx，有投影
- [ ] 表格可以水平滚动，滚动条隐藏
- [ ] 表格行颜色交替（白色/浅灰色）
- [ ] **重要**: 左右边距各48rpx，与页面其他元素对齐
- [ ] **重要**: 滚动时内容不被裁剪（无白色区域）
- [ ] **重要**: 滚动到最右侧时有48rpx呼吸空间
- [ ] 使用三层嵌套结构：table-wrapper > table-container > table

---

## 📏 样式规范总结

### 字体规范
| 元素 | 字号 | 颜色 | 样式 | 边距 |
|------|------|------|------|------|
| 页面标题 | 48rpx | #000000 | 加粗 | 上48rpx 下40rpx 左48rpx |
| 章节标题 | 40rpx | #000000 | 加粗 | 下32rpx 左48rpx |
| 子标题 | 32rpx | #000000 | 加粗 | 下24rpx 左48rpx |
| 表头 | 28rpx | #000000 | 加粗 | 上下16rpx 左右48rpx |
| 表格正文 | 28rpx | #666666 | 加粗 | 上下16rpx 左右48rpx |

### 布局规范
| 元素 | 特征 |
|------|------|
| 页面背景 | 纯白色 #ffffff |
| 表格圆角 | 24rpx |
| 表格投影 | 0 8rpx 25rpx rgba(0, 0, 0, 0.1) |
| 表格最小宽度 | 800rpx |
| 滚动条 | 隐藏 |
| 行颜色交替 | 白色 #ffffff / 浅灰 #FAFAFA |
| **页面底部边距** | **80rpx** |

### 页面底部边距实现
为了提升用户体验，每个知识库页面底部需要留出80rpx的空白边距，避免内容紧贴底部。

```css
/* 页面底部空白边距 */
.page::after {
  content: '';
  display: block;
  height: 80rpx;
}
```

**使用说明**：
- 在页面容器（通常是 `.page` 或 `.page-container`）上添加 `::after` 伪元素
- 设置固定高度 80rpx 作为底部留白
- 确保用户滚动到页面底部时有足够的视觉呼吸空间

---

## 🎯 支持的 Markdown 元素

### ✅ 当前支持
- **标题** (### ####) - 自动添加数字前缀
- **表格** (Table) - 圆角投影，交替色彩，水平滚动
- **粗体** (**文本**) - 在数据中标记

### 🔄 未来扩展
- 段落文本
- 列表
- 引用
- 代码块
- 链接
- 图片

---

## ⚠️ 重要注意事项

1. **不要在WXML中写内联样式** - 所有样式都在CSS文件中管理
2. **标题不设置margin-top** - 避免被其他样式覆盖
3. **表格投影需要padding空间** - table-wrapper要有padding-top和padding-bottom
4. **CSS优先级** - 使用!important确保页面标题样式不被覆盖
5. **表格宽度** - 使用CSS table布局自动计算，不需要JavaScript

---

## 📂 相关文件

- **数据**: `pages/grammar/grammar.js`
- **模板**: `pages/grammar/grammar.wxml`
- **样式**: `pages/grammar/grammar.wxss`
- **配置**: `pages/grammar/grammar.json`

---

## 📝 版本信息

- **创建日期**: 2024-12-19
- **最后更新**: 2024-12-19
- **版本**: v3.0.0 (统一版本)
- **状态**: ✅ 当前生效

---

**🎯 使用本规范可以快速、标准化地处理任何 Markdown 文档导入！**