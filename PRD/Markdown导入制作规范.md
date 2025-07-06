# Markdown 导入制作规范（统一版本）

## 📋 文档说明

这是微信小程序日语学习应用中 **Markdown 内容导入和页面制作的统一规范文档**。
所有 Markdown 导入工作请参照此文档执行。

---

## 🚀 快速导入流程

### 1️⃣ 接收 Markdown 文档
用户提供标准 markdown 格式的文档

### 2️⃣ 转换数据结构
按照本文档规范转换为 JavaScript 数据结构

### 3️⃣ 更新页面代码
更新 `pages/grammar/grammar.js` 中的数据

### 4️⃣ 验证样式效果
确保符合本文档的设计规范

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

### 📊 表格规范

#### 表格容器 (table-wrapper)
- **滚动**: 水平滚动（隐藏滚动条）
- **边距**: 左48rpx，右72rpx，上8rpx，下25rpx（为投影留空间）

```css
.table-wrapper {
  margin-bottom: 48rpx;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  padding-left: 48rpx;
  padding-right: 72rpx;
  padding-top: 8rpx;
  padding-bottom: 25rpx;
  width: 100%;
  box-sizing: border-box;
}

/* 隐藏滚动条 */
.table-wrapper::-webkit-scrollbar {
  height: 0;
  width: 0;
  display: none;
}
```

#### 表格主体 (table)
- **圆角**: 24rpx（2024年12月从48rpx调整）
- **投影**: `0 8rpx 25rpx rgba(0, 0, 0, 0.1)`
- **布局**: CSS table布局，自动计算列宽
- **最小宽度**: 800rpx（触发水平滚动）

```css
.table {
  display: table;
  width: auto;
  min-width: 800rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.1);
  table-layout: auto;
  border-collapse: separate;
  border-spacing: 0;
  margin-right: 48rpx;
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
- [ ] 右边滑动不贴边（有48rpx边距）

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