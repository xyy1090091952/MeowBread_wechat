# PRD: 全局图片加载优化

> DRAFT

- **Author:** Gemini
- **Date:** 2024-07-29
- **Version:** 1.0

---

## 1. 背景

目前小程序内多个页面存在图片加载缓慢的问题，尤其是在网络环境较差或首次加载时，严重影响用户体验。经排查，主要原因是：

1.  **图片链接硬编码**：大部分页面直接在 `.wxml` 或 `.js` 文件中硬编码了图片的远程 URL。
2.  **无缓存机制**：图片未被有效缓存和复用，每次进入页面都会重新触发网络请求。
3.  **加载方式单一**：缺少统一的图片加载管理机制，无法实现预加载、懒加载等高级优化策略。

虽然我们已经初步建立了 `imageManager` 模块并在 `app.js` 中实现了图片的预加载，但该能力尚未应用到具体的业务页面中。

## 2. 需求与目标

### 2.1. 核心需求

改造小程序内所有使用远程图片链接的页面和组件，使其通过统一的 `imageManager` 缓存管理器加载图片，以提升图片加载速度和用户体验。

### 2.2. 项目目标

1.  **提升性能**：显著降低图片的加载时间，实现“秒开”效果。
2.  **优化体验**：消除因图片加载缓慢导致的页面空白或闪烁问题。
3.  **统一管理**：建立统一的图片资源管理规范，便于后续维护和扩展。
4.  **降低成本**：减少不必要的 CDN 流量消耗。

## 3. 功能范围

本次改造将覆盖所有使用 `https://free.picui.cn` 图床链接的页面和模块。根据代码扫描结果，需要改造的范围包括：

| 优先级 | 页面/模块 | 文件路径 | 备注 |
| :--- | :--- | :--- | :--- |
| **P0** | **陈列馆** | `pages/gashapon/` | 用户反馈问题最突出的页面，优先改造。 |
| **P2** | **知识卡片学习** | `pages/card-study/` | 卡片背景图片。 |
| **P2** | **答题结果** | `pages/quiz-result/` | 结果页的奖励图片。 |
| **P2** | **数据文件** | `data/knowledge_cards.js` | 知识卡片数据源。 |
| **P2** | **数据文件** | `data/gashapon-prizes-config.js` | 扭蛋机奖品数据源。 |

## 4. 技术实现方案

通用的改造思路如下：

1.  **识别图片链接**：定位到页面 `.js` 文件 `data` 对象中或 `.wxml` 文件中写死的远程图片 URL。
2.  **引入管理器**：在页面的 `.js` 文件中，引入 `imageManager` 模块。
    ```javascript
    import imageManager from '../../utils/imageManager.js';
    ```
3.  **改造数据源**：
    *   对于在 `.js` `data` 中定义的图片链接，在页面的 `onLoad` 或 `onShow`生命周期中，调用 `imageManager.getImagePath(url)` 方法，将远程 URL 转换为本地缓存路径。
    *   使用 `async/await` 异步获取图片路径，并通过 `this.setData()` 更新页面数据。
    *   对于直接在 `.wxml` 中使用的图片，需要将其移至 `.js` 的 `data` 中进行管理。
4.  **更新视图**：修改 `.wxml` 文件，将 `<image>` 组件的 `src` 属性绑定到 `.js` 中经过 `imageManager` 处理后的本地路径变量。

### 4.1. 示例：改造 `pages/gashapon/gashapon.js`

**改造前 (`gashapon.js`):**
```javascript
// ...
Page({
  data: {
    machineImageUrl: 'https://free.picui.cn/free/2025/07/26/6883c5e4b8633.jpg',
    // ...
  }
});
```

**改造后 (`gashapon.js`):**
```javascript
import imageManager from '../../utils/imageManager.js';

Page({
  data: {
    machineImageUrl: '', // 初始为空
    // ...
  },
  async onLoad() {
    const localPath = await imageManager.getImagePath('https://free.picui.cn/free/2025/07/26/6883c5e4b8633.jpg');
    this.setData({
      machineImageUrl: localPath
    });
  }
});
```

**改造前 (`gashapon.wxml`):**
```html
<image src="{{machineImageUrl}}"></image>
```

**改造后 (`gashapon.wxml`):**
(无需改动，因为 `src` 已经绑定了 `machineImageUrl` 变量)

## 5. 开发计划

1.  **Phase 1: 陈列馆页面改造 (P0)**
    *   改造 `pages/gashapon/gashapon.js` 和 `pages/gashapon/gashapon.wxml`。
    *   验证图片加载速度和缓存功能。
2.  **Phase 2: 其余页面及数据文件改造 (P2)**
    *   完成剩余所有文件和模块的改造。
3.  **Phase 3: 回归测试**
    *   全面测试所有改造过的页面，确保功能正常。
    *   重点验证缓存清理、弱网环境下的表现。

## 6. 验收标准

1.  所有使用远程图片的页面，图片加载速度有明显提升。
2.  在“缓存管理”页面清除缓存后，图片能够被重新下载和加载。
3.  离线或弱网环境下，已缓存的图片能够正常显示。
4.  代码中不再存在硬编码的 `https://free.picui.cn` 图片链接（`data/imageList.js` 除外）。